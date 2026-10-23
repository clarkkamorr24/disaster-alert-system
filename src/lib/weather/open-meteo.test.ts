import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildForecastUrl,
  classifyRainfall,
  describeWeatherCode,
  fetchForecast,
  forecastTimeToDate,
  getZoneWeather,
  parseForecast,
} from "@/lib/weather/open-meteo";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();

function location(overrides: { time?: string; temp?: number; hourly?: (number | null)[] } = {}) {
  return {
    latitude: 13.11,
    longitude: 123.69,
    utc_offset_seconds: 28800,
    timezone: "Asia/Manila",
    current: {
      time: overrides.time ?? "2026-10-23T18:30",
      interval: 900,
      temperature_2m: overrides.temp ?? 26.7,
      precipitation: 0.2,
      weather_code: 3,
      wind_speed_10m: 8.4,
    },
    hourly: {
      time: ["2026-10-23T18:00", "2026-10-23T19:00", "2026-10-23T20:00"],
      precipitation: overrides.hourly ?? [0.1, 8.9, 3.6],
    },
  };
}

const singleObjectFixture = location();
const arrayFixture = [location(), location({ temp: 25.1, hourly: [2, 18.2, 0] })];

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("classifyRainfall", () => {
  it("follows the PAGASA thresholds", () => {
    expect([7.4, 7.5, 14.9, 15, 30, 30.1].map(classifyRainfall)).toEqual([
      "NONE",
      "YELLOW",
      "YELLOW",
      "ORANGE",
      "ORANGE",
      "RED",
    ]);
  });

  it("treats no rain as NONE", () => {
    expect(classifyRainfall(0)).toBe("NONE");
  });
});

describe("buildForecastUrl", () => {
  it("joins several points into one request", () => {
    expect(
      buildForecastUrl([
        { latitude: 13.2, longitude: 123.7 },
        { latitude: 13.1, longitude: 123.6 },
      ]),
    ).toBe(
      "https://api.open-meteo.com/v1/forecast?latitude=13.2,13.1&longitude=123.7,123.6&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation&forecast_hours=24&timezone=Asia%2FManila",
    );
  });
});

describe("parseForecast", () => {
  it("reads the single object Open-Meteo returns for one point", () => {
    const result = parseForecast(singleObjectFixture, 1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      tempC: 26.7,
      precipMm: 0.2,
      windKmh: 8.4,
      weatherCode: 3,
      maxRainNext24h: 8.9,
      rainfallLevel: "YELLOW",
      fetchedAt: "2026-10-23T18:30",
    });
  });

  it("reads an array in request order", () => {
    const result = parseForecast(arrayFixture, 2);

    expect(result[0]!.tempC).toBe(26.7);
    expect(result[1]!.maxRainNext24h).toBe(18.2);
    expect(result[1]!.rainfallLevel).toBe("ORANGE");
  });

  it("returns all nulls for an error body", () => {
    expect(parseForecast({ error: true, reason: "x" }, 2)).toEqual([null, null]);
  });

  it("nulls only the entry it can't read", () => {
    const broken = { ...location(), current: { time: "2026-10-23T18:30" } };

    expect(parseForecast([location(), broken], 2)).toEqual([expect.any(Object), null]);
  });

  it("pads with nulls when fewer entries come back than were requested", () => {
    expect(parseForecast([location()], 3)).toEqual([expect.any(Object), null, null]);
  });

  it("skips hours without a value", () => {
    expect(parseForecast(location({ hourly: [null, 4, null] }), 1)[0]!.maxRainNext24h).toBe(4);
  });

  it("returns null when no hour has a value", () => {
    expect(parseForecast(location({ hourly: [null, null] }), 1)).toEqual([null]);
  });

  it("returns nulls for a body that isn't an object", () => {
    expect(parseForecast(null, 1)).toEqual([null]);
  });
});

describe("describeWeatherCode", () => {
  it.each([
    [0, "Clear"],
    [1, "Partly cloudy"],
    [3, "Partly cloudy"],
    [45, "Fog"],
    [48, "Fog"],
    [51, "Drizzle"],
    [57, "Drizzle"],
    [61, "Rain"],
    [67, "Rain"],
    [80, "Rain showers"],
    [82, "Rain showers"],
    [95, "Thunderstorm"],
    [99, "Thunderstorm"],
  ])("describes %i as %s", (code, text) => {
    expect(describeWeatherCode(code)).toBe(text);
  });

  it.each([4, 46, 71, 85, 100])("uses a dash for %i", (code) => {
    expect(describeWeatherCode(code)).toBe("—");
  });
});

describe("forecastTimeToDate", () => {
  it("reads Open-Meteo's Manila local time", () => {
    expect(forecastTimeToDate("2026-10-23T18:30").toISOString()).toBe("2026-10-23T10:30:00.000Z");
  });
});

describe("network", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchForecast", () => {
    it("returns the JSON body with a timeout signal", async () => {
      fetchMock.mockResolvedValue(jsonResponse(singleObjectFixture));

      await expect(fetchForecast("https://example.test/forecast")).resolves.toEqual(singleObjectFixture);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.test/forecast",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it("throws on a non-2xx response so the failure isn't cached", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: true, reason: "x" }, { status: 400 }));

      await expect(fetchForecast("https://example.test/forecast")).rejects.toThrow("Open-Meteo returned 400.");
    });
  });

  describe("getZoneWeather", () => {
    const zones = [
      { id: "z1", latitude: 13.2, longitude: 123.7 },
      { id: "z2", latitude: 13.1, longitude: 123.6 },
    ];

    it("maps one request's results back by zone id", async () => {
      fetchMock.mockResolvedValue(jsonResponse(arrayFixture));

      const result = await getZoneWeather(zones);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(buildForecastUrl(zones));
      expect(result.z1!.tempC).toBe(26.7);
      expect(result.z2!.maxRainNext24h).toBe(18.2);
    });

    it("reads a single zone's object response", async () => {
      fetchMock.mockResolvedValue(jsonResponse(singleObjectFixture));

      const result = await getZoneWeather([zones[0]]);

      expect(result.z1!.fetchedAt).toBe("2026-10-23T18:30");
    });

    it("returns nulls without throwing when the request fails", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      await expect(getZoneWeather(zones)).resolves.toEqual({ z1: null, z2: null });
    });

    it("returns nulls for a non-2xx response", async () => {
      fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

      await expect(getZoneWeather(zones)).resolves.toEqual({ z1: null, z2: null });
    });

    it("returns nulls when the body isn't JSON", async () => {
      fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

      await expect(getZoneWeather(zones)).resolves.toEqual({ z1: null, z2: null });
    });

    it("doesn't call the network for no zones", async () => {
      await expect(getZoneWeather([])).resolves.toEqual({});
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

/** The association note and the weather data credit at the bottom of the dashboard. */
export function DashboardFooter() {
  return (
    <footer className="flex flex-wrap justify-between gap-2 px-0.5 pt-[29px] pb-0.5 text-[10px] text-[#919c94] dark:text-muted-foreground">
      <span>
        Mi-isi Farmers Association · Supplements, and does not replace, official agencies such as PAGASA and
        NDRRMC.
      </span>
      <span>Weather advisory data by Open-Meteo</span>
    </footer>
  );
}

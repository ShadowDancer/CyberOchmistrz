import { Cruise } from "@/model/cruise";

export function exportCruise(cruise: Cruise): void {
  const json = JSON.stringify(cruise, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `rejs-${cruise.name}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importCruiseFromFile(file: File): Promise<Cruise> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Cruise;
  return parsed;
}

// utils/captureCharts.ts
import html2canvas from 'html2canvas';

export async function captureCharts(): Promise<string[]> {
  const chartElements = Array.from(document.querySelectorAll('.recharts-wrapper'));
  const chartImages = await Promise.all(
    chartElements.map(async (chart) => {
      const canvas = await html2canvas(chart as HTMLElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      return canvas.toDataURL('image/png', 0.5);
    })
  );

  return chartImages;
}
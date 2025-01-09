// utils/captureCharts.ts
import html2canvas from 'html2canvas';

export async function captureCharts() {
  const chartElements = Array.from(document.querySelectorAll('.recharts-wrapper'));
  const chartImages = [];

  for (const chart of chartElements) {
    const canvas = await html2canvas(chart as HTMLElement, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/png');
    chartImages.push(imgData);
  }

  return chartImages;
}
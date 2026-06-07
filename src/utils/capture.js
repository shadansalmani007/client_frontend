import html2canvas from "html2canvas";

export async function downloadElementScreenshot(element, filename = "trip-details.png") {
  if (!element) {
    throw new Error("Trip details are not ready to capture yet.");
  }

  const canvas = await html2canvas(element, {
    backgroundColor: "#f8fafc",
    scale: Math.max(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
  });

  const downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = canvas.toDataURL("image/png");
  downloadLink.click();
}

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generatePDF = async (
  elementId: string,
  filename: string,
  title: string,
  date: string,
  hiddenSections: string[]
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Temporarily hide unselected sections
  const originalStyles: { el: HTMLElement; display: string }[] = [];
  hiddenSections.forEach(sectionId => {
    const el = document.getElementById(sectionId);
    if (el) {
      originalStyles.push({ el, display: el.style.display });
      el.style.display = 'none';
    }
  });

  // Add a temporary title and date to the top of the element
  const headerDiv = document.createElement('div');
  headerDiv.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif; background: white; margin-bottom: 20px;">
      <h1 style="font-size: 24px; color: #1A1A1A; margin-bottom: 8px;">${title}</h1>
      <p style="font-size: 14px; color: #4A5568;">Report Date: ${date}</p>
      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin-top: 20px;" />
    </div>
  `;
  element.insertBefore(headerDiv, element.firstChild);

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Scale image to fit the width of the PDF page
    const ratio = pdfWidth / imgWidth;
    
    const imgX = 0;
    let position = 0;
    let heightLeft = imgHeight * ratio;

    pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth, imgHeight * ratio);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight * ratio;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', imgX, position, pdfWidth, imgHeight * ratio);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    // Cleanup
    if (element.contains(headerDiv)) {
      element.removeChild(headerDiv);
    }
    originalStyles.forEach(({ el, display }) => {
      el.style.display = display;
    });
  }
};

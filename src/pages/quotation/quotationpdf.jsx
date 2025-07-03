import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import Logo from '../../assets/Primary Logo 01.png';

// Helper functions
const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  return `₹${numAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const convertNumberToWords = (num) => {
  if (typeof num !== "number" || isNaN(num)) return "N/A";
  let number = Math.floor(num);
  let decimal = Math.round((num - number) * 100);

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const scales = ["", "Thousand", "Lakh", "Crore"];

  const numToWords = (n) => {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
  };

  let words = [];
  let i = 0;

  if (number === 0) {
    words.push("Zero");
  } else {
    let lastThree = number % 1000;
    if (lastThree > 0) {
      if (lastThree < 100) {
        words.push(numToWords(lastThree));
      } else {
        words.push(units[Math.floor(lastThree / 100)] + " Hundred" + (lastThree % 100 !== 0 ? " " + numToWords(lastThree % 100) : ""));
      }
    }
    number = Math.floor(number / 1000);

    while (number > 0) {
      let chunk = number % 100;
      if (chunk > 0) {
        words.push(numToWords(chunk) + " " + scales[++i]);
      } else {
        i++;
      }
      number = Math.floor(number / 100);
    }
  }

  const finalWords = words.reverse().filter(Boolean).join(" ").trim();
  let result = finalWords ? finalWords + " Rupees" : "Zero Rupees";

  if (decimal > 0) {
    result += ` and ${numToWords(decimal)} Paisa`;
  }
  result += " Only";

  return result.replace(/\s+/g, ' ');
};

const generateQuotationHtmlParts = (quotation) => {
  const subTotalAmount = quotation.items?.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  ) || 0;

  const gstRate = 0.18;
  const gstAmount = subTotalAmount * gstRate;
  const billAmount = subTotalAmount + gstAmount;

  const companyLogoSrc = Logo;
  const signatureImageSrc = "YOUR_SIGNATURE_IMAGE_BASE64_DATA_URL_HERE";

  // Modern header with gradient and better spacing
  const commonHeaderHtml = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div style="display: flex; align-items: center;">
          <img src="${companyLogoSrc}" alt="Company Logo" style="height: 70px; margin-right: 15px;">
          <div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #2c3e50; margin-bottom: 5px;">ACE AUTOMATION</h2>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">S.F. No. 91, 14B, Padiveedu Thottam,</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">Kalapatty road, Saravanampatti (PO),</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">Coimbatore - 641 035. TN, INDIA.</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">+91 98422 53389 | aceautomation.cbe@gmail.com</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">www.aceautomation.in | GST No. : 33AVDPD3093Q1ZD</p>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #ff6600, #ff8c00); color: white; padding: 15px 25px; font-weight: 600; font-size: 20px; text-align: center; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          QUOTATION
        </div>
      </div>
      <div style="border-bottom: 2px solid #eee; margin-bottom: 15px;"></div>
    </div>
  `;

  // Page 1 with modern card-like design
  const page1Html = `
    <div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); background: white;">
      ${commonHeaderHtml}

      <div style="margin-bottom: 25px; background: #f9fafb; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 25%; background: #f0f2f5;">Company Name</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; width: 25%;">${quotation.businessName || "N/A"}</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 25%; background: #f0f2f5;">Date</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; width: 25%;">${
              quotation.date
                ? new Date(quotation.date).toLocaleDateString("en-IN")
                : new Date().toLocaleDateString("en-IN")
            }</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Contact Person</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;">${quotation.customerName || "N/A"}</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Quotation No</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;">${quotation.quotationNumber || "N/A"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Contact Number</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;">${quotation.customerPhone || "N/A"}</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Customer GST No.</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;">${quotation.gstin || "N/A"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Contact Email</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;" colspan="3">${quotation.customerEmail || "N/A"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; background: #f0f2f5;">Address</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px;" colspan="3">${
              quotation.businessInfo?.replace(/\n/g, '<br>') || "N/A"
            }</td>
          </tr>
        </table>
      </div>

      ${
        quotation.items?.length > 0
          ? `
          <div style="margin-top: 25px; overflow: hidden; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; font-size: 12px;">
              <colgroup>
                <col style="width: 8%;"> <col style="width: 32%;"> <col style="width: 15%;"> <col style="width: 22.5%;"> <col style="width: 22.5%;"> </colgroup>
              <thead>
                <tr style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white;">
                  <th style="border: 1px solid #2c3e50; padding: 10px; text-align: center;">S.No</th>
                  <th style="border: 1px solid #2c3e50; padding: 10px; text-align: left;">Description</th>
                  <th style="border: 1px solid #2c3e50; padding: 10px; text-align: center;">Quantity</th>
                  <th style="border: 1px solid #2c3e50; padding: 10px; text-align: right;">Unit Price (₹)</th>
                  <th style="border: 1px solid #2c3e50; padding: 10px; text-align: right;">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items
                  .map(
                    (item, idx) => `
                    <tr style="${idx % 2 === 0 ? 'background: #fff;' : 'background: #f9fafb;'}">
                      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center; vertical-align: top;">${idx + 1}</td>
                      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: left; vertical-align: top;">${
                        item.description || "N/A"
                      }</td>
                      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: center; vertical-align: top;">${
                        parseFloat(item.quantity) || 0
                      }</td>
                      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; vertical-align: top;">${formatCurrency(
                        item.rate || 0
                      )}</td>
                      <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; font-weight: 600; vertical-align: top;">
                        ${formatCurrency((item.quantity || 0) * (item.rate || 0))}
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 15px; background: #f9fafb; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="width: 70%;"></td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; font-weight: 600; width: 15%; background: #f0f2f5;">Sub Total</td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; font-weight: 600; width: 15%;">${formatCurrency(subTotalAmount)}</td>
              </tr>
              <tr>
                <td style="width: 70%;"></td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; width: 15%; background: #f0f2f5;">GST (18%)</td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; width: 15%;">${formatCurrency(gstAmount)}</td>
              </tr>
              <tr style="background: #e8f5e9;">
                <td style="width: 70%;"></td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; font-weight: 600; font-size: 13px; width: 15%;">Total Amount</td>
                <td style="border: 1px solid #e0e0e0; padding: 10px; text-align: right; font-weight: 600; font-size: 13px; width: 15%;">${formatCurrency(billAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 15px; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="font-weight: 600; padding: 4px; width: 25%; color: #555;">Amount In Words</td>
                <td style="padding: 4px; font-style: italic; width: 75%;">${convertNumberToWords(billAmount)}</td>
              </tr>
            </table>
          </div>
        `
          : ""
      }

      <div style="margin-top: 20px; font-size: 12px; color: #555;">
        <p style="margin: 5px 0; font-style: italic; color: #666;">"We appreciate your business inquiry and look forward to serving you with our quality products and services."</p>

        <div style="margin: 15px 0;">
          <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">With Best Regards</p>
          <p style="margin: 5px 0; color: #555;">For Ace Automation</p>
        </div>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        <div style="text-align: right;">
          <img src="${signatureImageSrc}" alt="Authorized Signature" style="height: 60px; display: block; margin-left: auto; margin-bottom: 5px;">
          <p style="margin: 5px 0; font-size: 12px; font-weight: 600; color: #2c3e50;">Authorized Signatory</p>
        </div>
      </div>
      <p style="text-align: center; font-size: 10px; color: #999; margin-top: 20px;">Page 1/2</p>
    </div>
  `;

  // Page 2 with modern design
  const productSpecificationsSections = quotation.items
    ?.filter(item => item.specifications && item.specifications.length > 0)
    .map(item => {
      const productTitle = item.productName || item.description || 'Product';
      const productSpecTitleAppendix = `- ${productTitle}`;

      const productSpecificationsRows = item.specifications
        .map(
          (spec) => `
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 40%; background: #f9f9f9; vertical-align: top;">${spec.name || ''}</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${spec.value || ''}</td>
          </tr>
        `
        )
        .join("");

      return `
        <div style="margin-bottom: 20px; background: #f9fafb; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 8px 12px; font-weight: 600; font-size: 13px;">
            PRODUCT SPECIFICATIONS ${productSpecTitleAppendix}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tbody>
              ${productSpecificationsRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  const generalTermsHtml = `
    <div style="margin-top: 20px; background: #f9fafb; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 8px 12px; font-weight: 600; font-size: 13px;">
        GENERAL TERMS & CONDITIONS
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tbody>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 30%; background: #f0f2f5; vertical-align: top;">Payment Terms</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${quotation.Payment || "50% advance, 50% on delivery"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 30%; background: #f0f2f5; vertical-align: top;">Delivery Period</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${quotation.Delivery ? `${quotation.Delivery} days` : "Within 15 working days after advance"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 30%; background: #f0f2f5; vertical-align: top;">Warranty</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${quotation.Warranty ? `${quotation.Warranty} year(s)` : "1 year from the date of invoice"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 30%; background: #f0f2f5; vertical-align: top;">Freight</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${quotation.Freight || "Extra as per actual"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 8px; font-weight: 600; width: 30%; background: #f0f2f5; vertical-align: top;">Validity</td>
            <td style="border: 1px solid #e0e0e0; padding: 8px; vertical-align: top;">${quotation.Validity || "30 days from the date of quotation"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const page2Html = `
    <div style="padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); background: white;">
      ${commonHeaderHtml}

      ${productSpecificationsSections}

      ${generalTermsHtml}

      <div style="margin-top: 20px; font-size: 12px; color: #555;">
        <p style="margin: 5px 0; font-style: italic; color: #666;">"Thank you for considering our proposal. We assure you of our best services and support at all times."</p>

        <div style="margin: 15px 0;">
          <p style="margin: 5px 0; font-weight: 600; color: #2c3e50;">With Best Regards</p>
          <p style="margin: 5px 0; color: #555;">For Ace Automation</p>
        </div>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        <div style="text-align: right;">
          <img src="${signatureImageSrc}" alt="Authorized Signature" style="height: 60px; display: block; margin-left: auto; margin-bottom: 5px;">
          <p style="margin: 5px 0; font-size: 12px; font-weight: 600; color: #2c3e50;">Authorized Signatory</p>
        </div>
      </div>
      <p style="text-align: center; font-size: 10px; color: #999; margin-top: 20px;">Page 2/2</p>
    </div>
  `;

  return { page1Html, page2Html };
};

export const downloadQuotationPdf = async (record) => {
  const toastId = toast.loading("Generating PDF...", {
    position: "top-center",
  });

  let tempDivPage1 = null;
  let tempDivPage2 = null;

  try {
    const { page1Html, page2Html } = generateQuotationHtmlParts(record);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      hotfixes: ["px_scaling"]
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const padding = 10;

    // --- Render Page 1 ---
    tempDivPage1 = document.createElement("div");
    tempDivPage1.style.position = "fixed";
    tempDivPage1.style.top = "-9999px";
    tempDivPage1.style.left = "-9999px";
    tempDivPage1.style.width = `${pdfWidth - 2 * padding}mm`;
    tempDivPage1.style.padding = `${padding}mm`;
    tempDivPage1.style.background = "white";
    tempDivPage1.style.zIndex = "-1";
    tempDivPage1.style.display = "block";
    tempDivPage1.innerHTML = page1Html;
    document.body.appendChild(tempDivPage1);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvasPage1 = await html2canvas(tempDivPage1, {
      scale: 3,
      useCORS: true,
      logging: false,
      allowTaint: true,
      letterRendering: true,
      backgroundColor: "#ffffff"
    });

    const imgDataPage1 = canvasPage1.toDataURL("image/png", 1.0);
    const imgPropsPage1 = pdf.getImageProperties(imgDataPage1);
    const imgHeightPage1 = (imgPropsPage1.height * (pdfWidth - 2 * padding)) / imgPropsPage1.width;

    pdf.addImage(imgDataPage1, "PNG", padding, padding, pdfWidth - 2 * padding, imgHeightPage1);

    // --- Render Page 2 ---
    pdf.addPage();

    tempDivPage2 = document.createElement("div");
    tempDivPage2.style.position = "fixed";
    tempDivPage2.style.top = "-9999px";
    tempDivPage2.style.left = "-9999px";
    tempDivPage2.style.width = `${pdfWidth - 2 * padding}mm`;
    tempDivPage2.style.padding = `${padding}mm`;
    tempDivPage2.style.background = "white";
    tempDivPage2.style.zIndex = "-1";
    tempDivPage2.style.display = "block";
    tempDivPage2.innerHTML = page2Html;
    document.body.appendChild(tempDivPage2);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvasPage2 = await html2canvas(tempDivPage2, {
      scale: 3,
      useCORS: true,
      logging: false,
      allowTaint: true,
      letterRendering: true,
      backgroundColor: "#ffffff"
    });

    const imgDataPage2 = canvasPage2.toDataURL("image/png", 1.0);
    const imgPropsPage2 = pdf.getImageProperties(imgDataPage2);
    const imgHeightPage2 = (imgPropsPage2.height * (pdfWidth - 2 * padding)) / imgPropsPage2.width;

    pdf.addImage(imgDataPage2, "PNG", padding, padding, pdfWidth - 2 * padding, imgHeightPage2);

    pdf.save(`${record.quotationNumber || "quotation"}_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("PDF downloaded successfully!", { id: toastId });
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    toast.error("Failed to generate PDF. Please try again.", { id: toastId });
  } finally {
    if (tempDivPage1 && document.body.contains(tempDivPage1)) {
      document.body.removeChild(tempDivPage1);
    }
    if (tempDivPage2 && document.body.contains(tempDivPage2)) {
      document.body.removeChild(tempDivPage2);
    }
  }
};
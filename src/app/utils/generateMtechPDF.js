import { jsPDF } from "jspdf";

export const generateMtechPDF = (data) => {
  const doc = new jsPDF();
  
  const darkColor = [31, 41, 55]; // Gray-800
  
  // Header text
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("COLLEGE OF ENGINEERING TRIVANDRUM", 15, 20);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("M.Tech (Working Professionals) Admission Application 2026-27", 15, 28);
  
  // Header dividing line
  doc.setDrawColor(0, 0, 0);
  doc.line(15, 33, 195, 33);
  
  let y = 35;
  
  const drawSectionHeader = (title) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 4, 180, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), 18, y + 1);
    y += 8;
  };
  
  const drawRow = (label1, value1, label2, value2) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label1 + ":", 18, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkColor);
    doc.text(String(value1 || "N/A"), 55, y);
    
    if (label2) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(label2 + ":", 110, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkColor);
      doc.text(String(value2 || "N/A"), 145, y);
    }
    
    y += 6.5;
  };
  
  // Personal Info
  drawSectionHeader("Personal Information");
  drawRow("Full Name", data.name, "Email Address", data.email);
  drawRow("Phone Number", data.phone, "Aadhaar Number", data.adharNumber);
  y += 1;
  
  // Qualifying Degree Details
  drawSectionHeader("B.Tech / Qualifying Degree Details");
  drawRow("B.Tech Degree Branch", data.btechDegree, "B.Tech Marks %", data.btechMark ? `${data.btechMark}%` : "N/A");
  drawRow("College Name", data.btechCollege, "University", data.btechUniversity);
  drawRow("Year of Passing", data.btechYear);
  y += 1;
  
  // Specialization Choice
  drawSectionHeader("M.Tech Preference");
  drawRow("Preferred Specialization", data.specialization);
  y += 1;
  
  // Demographic Details
  drawSectionHeader("Demographic Details");
  drawRow("Religion", data.religion, "Caste", data.caste);
  drawRow("Reservation Category", data.reservationCategory || data.category);
  y += 1;
  
  // Professional Details
  drawSectionHeader("Professional Details");
  drawRow("Current Company", data.company, "Experience (Years)", data.experience);
  drawRow("Distance to CET", data.distance ? `${data.distance} KM` : "N/A", "Age", data.age);
  
  // Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Address:", 18, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkColor);
  const addressLines = doc.splitTextToSize(String(data.address || "N/A"), 135);
  doc.text(addressLines, 55, y);
  
  y += addressLines.length * 4.5 + 3;
  
  // Registration Fee Details
  drawSectionHeader("Registration Fee Details");
  drawRow("Transaction / UTR ID", data.transactionId);
  y += 1;
  
  // Signature/Declaration
  if (y > 255) {
    doc.addPage();
    y = 30;
  }
  
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, 195, y);
  y += 6;
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const decl = "I hereby declare that all the information provided in this application form is true, complete and correct to the best of my knowledge and belief.";
  const declLines = doc.splitTextToSize(decl, 175);
  doc.text(declLines, 18, y);
  
  y += 15;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text("Date: " + new Date().toLocaleDateString("en-GB"), 18, y);
  
  doc.text("Signature of the Applicant", 145, y);
  doc.line(145, y - 4, 190, y - 4);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const noteText = "A hard copy of the signed application generated through the portal must be submitted at the time of admission.";
  const noteLines = doc.splitTextToSize(noteText, 175);
  doc.text(noteLines, 15, y);
  
  doc.save(`Application_MTech_${(data.name || "Submitted").replace(/\s+/g, "_")}.pdf`);
};

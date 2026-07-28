// regenerate_with_signatures.js
import { jsPDF } from "jspdf";
import fs from 'fs';
import * as XLSX from 'xlsx';

const admittedList = [
  { name: "Siva P S", branch: "Computer Science and Engineering" },
  { name: "Mohammed Noorudeen N S", branch: "Mechanical Engineering" },
  { name: "BINSHAD K B", branch: "Computer Science and Engineering" },
  { name: "SHIRISKAR SHLOK SHARAD", branch: "Mechanical Engineering" },
  { name: "Lijo Varghese", branch: "Mechanical Engineering" },
  { name: "Anas Shaikh Chenothuparambil", branch: "Computer Science and Engineering" },
  { name: "SUMESH S R", branch: "Computer Science and Engineering" },
  { name: "Kanhaiya Kumar", branch: "Mechanical Engineering" },
  { name: "ANANDAMOORTHY S", branch: "Mechanical Engineering" },
  { name: "ARJUN B RAJ", branch: "Electronics and Communication Engineering" },
  { name: "Adharsh Reji", branch: "Mechanical Engineering" },
  { name: "Sana Mol P.A", branch: "Computer Science and Engineering" },
  { name: "Midhun A Madhu", branch: "Electronics and Communication Engineering" },
  { name: "MUHAMMED AFSAL A", branch: "Computer Science and Engineering" },
  { name: "Bineesh B", branch: "Electronics and Communication Engineering" },
  { name: "VIBIN VASANTH", branch: "Mechanical Engineering" },
  { name: "REMYA LAZAR", branch: "Electronics and Communication Engineering" },
  { name: "VIPIN S R", branch: "Mechanical Engineering" },
  { name: "MOHAMMED HARIS A", branch: "Computer Science and Engineering" },
  { name: "ABHIJITH BS", branch: "Electronics and Communication Engineering" },
  { name: "Albin Raj R", branch: "Mechanical Engineering" },
  { name: "Adin N S", branch: "Computer Science and Engineering" },
  { name: "Anandhu Krishnan S", branch: "Computer Science and Engineering" },
  { name: "AJAY C", branch: "Computer Science and Engineering" },
  { name: "Shifa thasneem T S", branch: "Computer Science and Engineering" },
  { name: "APARNA B S", branch: "Computer Science and Engineering" },
  { name: "Adhithya Krishna S L", branch: "Electronics and Communication Engineering" },
  { name: "ANURAGE SS", branch: "Computer Science and Engineering" },
  { name: "SARASWATHY T", branch: "Computer Science and Engineering" },
  { name: "Jishnu saseendran", branch: "Mechanical Engineering" },
  { name: "Shameer A N", branch: "Computer Science and Engineering" },
  { name: "AMAL M", branch: "Mechanical Engineering" },
  { name: "ADITHYAN S R", branch: "Computer Science and Engineering" },
  { name: "RAIHANA RAHMAN", branch: "Computer Science and Engineering" },
  { name: "Rohan Raynish", branch: "Computer Science and Engineering" },
  { name: "SHIJINA NIZAR", branch: "Computer Science and Engineering" },
  { name: "SHABANA SN", branch: "Computer Science and Engineering" },
  { name: "SUDHER BP", branch: "Computer Science and Engineering" },
  { name: "Arif muhammad F", branch: "Computer Science and Engineering" },
  { name: "MUNEER M", branch: "Computer Science and Engineering" },
  { name: "ABHISHEK S", branch: "Computer Science and Engineering" },
  { name: "Athul Krishnan A S", branch: "Computer Science and Engineering" },
  { name: "Akshay Subhash", branch: "Mechanical Engineering" }
];

const normalizeEducation = (educationValue) => {
  if (!educationValue || typeof educationValue !== 'string') return educationValue;
  const education = educationValue.toLowerCase().trim();
  const educationMap = {
    'Diploma': ['diploma'],
    'BSc': ['bsc', 'b.sc', 'bachelor of science', 'b sc'],
    'BVoc': ['bvoc', 'b.voc', 'bachelor of vocation', 'b voc'],
    'BE': ['be', 'b.e', 'bachelor of engineering', 'b e'],
    'BTech': ['btech', 'b.tech', 'bachelor of technology', 'b tech'],
  };
  for (const [standardForm, keywords] of Object.entries(educationMap)) {
    for (const keyword of keywords) {
      if (education.includes(keyword)) return standardForm;
    }
  }
  return educationValue;
};

const normalizeName = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const getCategoryKey = (app) => {
  const map = {
    'EWS': 'EWS', 'Ezhava': 'EZ', 'Muslim': 'M', 'OBH': 'BH',
    'Other Backward Hindu': 'BH',
    'Latin Catholic': 'LC', 'Latin Catholic and Anglo Indian': 'LC',
    'Dheevara': 'DV', 'Viswakarma': 'VK',
    'Kusavan': 'KN', 'OBC Christian': 'BX', 'Kudumbi': 'KU',
    'SC': 'SC', 'ST': 'ST', 'Physically Disabled': 'PD', 'Transgender': 'TG',
    'Sports': 'SPORTS', 'DTE Staff': 'STAFF', 'Central govt. employee': 'CENTRAL',
  };
  const categoryValue = app.category || app.reservationCategory;
  return map[categoryValue] || null;
};

const mapDepartmentNameToKey = (name) => {
  const map = {
    "Electrical and Electronics Engineering": "ee",
    "Mechanical Engineering": "mech",
    "Civil Engineering": "ce",
    "Computer Science and Engineering": "cse",
    "Electronics and Communication Engineering": "ece",
  };
  return map[name] || null;
};

const extractChoices = (app) => {
  if (app.priorityChoices && typeof app.priorityChoices === 'object') {
    return Object.values(app.priorityChoices)
      .filter(Boolean)
      .map(mapDepartmentNameToKey)
      .filter(Boolean);
  }
  return [];
};

const MAX_DISTANCE = 70;
const getMinMarkForCategory = (app) => {
  const reservedCategories = [
    "SC", "ST", "EZ", "M", "BH", "LC", "DV", "VK", "KN", "BX", "KU", "EWS",
    "PD", "TG", "SPORTS", "STAFF", "CENTRAL"
  ];
  const categoryKey = getCategoryKey(app);
  return reservedCategories.includes(categoryKey) ? 40 : 45;
};

const MIN_EXPERIENCE = 1;
const isValidRank = (letRank) => {
  const num = Number(letRank);
  return !isNaN(num) && Number.isFinite(num) && num >= 1;
};

const isEligibleForAllotment = (app) => {
  const validMark = parseFloat(app.mark) >= getMinMarkForCategory(app);
  const validDistance = parseFloat(app.distance) <= MAX_DISTANCE;
  const validRank = isValidRank(app.letRank);
  const validExperience = parseFloat(app.experience) >= MIN_EXPERIENCE;
  return validDistance && validRank && validMark && validExperience;
};

const getEducationPriority = (education) => {
  const priorityMap = { 'BE': 1, 'BTech': 1, 'Diploma': 2, 'BSc': 3, 'BVoc': 4, 'Other': 5 };
  return priorityMap[education] || 5;
};

const sortByEducationThenRankThenMarks = (applications) => {
  return applications.sort((a, b) => {
    const eduPriorityA = getEducationPriority(a.education);
    const eduPriorityB = getEducationPriority(b.education);
    if (eduPriorityA !== eduPriorityB) return eduPriorityA - eduPriorityB;
    const rankA = parseFloat(a.letRank);
    const rankB = parseFloat(b.letRank);
    if (rankA !== rankB) return rankA - rankB;
    return parseFloat(b.mark) - parseFloat(a.mark);
  });
};

const sortAllottedList = (students) => {
  const preAdmitted = students.filter(s => s.isPreAdmitted);
  const newlyAllotted = students.filter(s => !s.isPreAdmitted);

  preAdmitted.sort((a, b) => (a.admNo || 0) - (b.admNo || 0));

  newlyAllotted.sort((a, b) => {
    const epA = getEducationPriority(a.education);
    const epB = getEducationPriority(b.education);
    if (epA !== epB) return epA - epB;
    const rA = parseFloat(a.letRank) || 999999;
    const rB = parseFloat(b.letRank) || 999999;
    if (rA !== rB) return rA - rB;
    return (parseFloat(b.mark) || 0) - (parseFloat(a.mark) || 0);
  });

  return [...preAdmitted, ...newlyAllotted];
};

async function main() {
  try {
    console.log("Loading local applications_2026.json file...");
    const apps2026Raw = JSON.parse(fs.readFileSync('applications_2026.json', 'utf8'));

    // Deduplicate B.Tech 2026 applications
    const seenKeys = new Set();
    const dedupedApps = [];
    apps2026Raw.forEach(app => {
      const normName = normalizeName(app.name);
      const normEmail = app.email ? app.email.toLowerCase().trim() : '';
      const normPhone = app.phone ? app.phone.replace(/[^0-9]/g, '') : '';
      
      const key = normName + "_" + normEmail + "_" + normPhone;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        dedupedApps.push(app);
      }
    });

    const apps2026 = dedupedApps.map(app => ({
      ...app,
      education: normalizeEducation(app.highestEducation)
    }));

    console.log(`Deduplicated applications: ${apps2026.length}`);

    // Setup departments
    const departmentsData = [
      { "name": "Computer Science and Engineering", "totalSeats": 30 },
      { "name": "Electronics and Communication Engineering", "totalSeats": 30 },
      { "name": "Mechanical Engineering", "totalSeats": 30 },
      { "name": "Waiting List", "totalSeats": 100 }
    ];

    const SEBC_CATEGORIES = ["EZ", "M", "BH", "LC", "DV", "VK", "KN", "BX", "KU"];
    const SPECIAL_CATEGORIES = ["TG", "PD", "SPORTS", "STAFF", "CENTRAL"];

    const updatedDepartments = departmentsData.map((dept) => {
      const totalSeats = dept.totalSeats;
      const seatDistribution = {
        SM: Math.round(totalSeats * 0.5), // 15
        EWS: Math.round(totalSeats * 0.1), // 3
        SC: Math.round(totalSeats * 0.08), // 2
        ST: Math.round(totalSeats * 0.02), // 1
        EZ: Math.round(totalSeats * 0.09), // 3
        M: Math.round(totalSeats * 0.08), // 2
        BH: Math.round(totalSeats * 0.03), // 1
        LC: Math.round(totalSeats * 0.03), // 1
        DV: Math.round(totalSeats * 0.02), // 1
        VK: Math.round(totalSeats * 0.02), // 1
        KN: Math.round(totalSeats * 0.01), // 0
        BX: Math.round(totalSeats * 0.01), // 0
        KU: Math.round(totalSeats * 0.01), // 0
        PD: 2, TG: 1, SPORTS: 1, STAFF: 1, CENTRAL: 1
      };

      return {
        ...dept,
        allottedStudents: [],
        filledSeats: 0,
        smSeatsFilled: 0,
        seatDistribution,
        categorySeatsFilled: Object.fromEntries(
          ['SM', 'EWS', 'SC', 'ST', ...SEBC_CATEGORIES, ...SPECIAL_CATEGORIES].map(cat => [cat, 0])
        ),
      };
    });

    const allotments = new Map();

    // Match admitted students
    const matchedAdmittedApps = [];
    const normAdmittedMap = new Map(admittedList.map(item => [normalizeName(item.name), item]));

    apps2026.forEach(app => {
      const normAppName = normalizeName(app.name);
      if (normAdmittedMap.has(normAppName)) {
        const admittedInfo = normAdmittedMap.get(normAppName);
        matchedAdmittedApps.push({
          ...app,
          isPreAdmitted: true,
          admNo: admittedInfo.admNo,
          admittedBranch: admittedInfo.branch,
          priorityChoices: { "1": admittedInfo.branch }
        });
      }
    });

    // Other remaining applicants
    const remainingApps = apps2026.filter(app => !normAdmittedMap.has(normalizeName(app.name)));

    // 1. Process Admitted candidates first (sorted by merit)
    const sortedAdmitted = sortByEducationThenRankThenMarks(matchedAdmittedApps);

    for (const app of sortedAdmitted) {
      const choice = mapDepartmentNameToKey(app.admittedBranch);
      const categoryKey = getCategoryKey(app);
      const dept = updatedDepartments.find(d => mapDepartmentNameToKey(d.name) === choice);
      
      if (!dept) continue;

      dept.filledSeats++;
      dept.allottedStudents.push(app.id);

      let allottedCat = "SM";
      if (dept.smSeatsFilled < dept.seatDistribution.SM) {
        dept.smSeatsFilled++;
        dept.categorySeatsFilled.SM++;
        allottedCat = "SM";
      } else if (categoryKey && categoryKey !== "General" && dept.seatDistribution[categoryKey] > 0 &&
                 dept.categorySeatsFilled[categoryKey] < dept.seatDistribution[categoryKey]) {
        dept.categorySeatsFilled[categoryKey]++;
        allottedCat = categoryKey;
      } else {
        if (categoryKey && categoryKey !== "General") {
          dept.categorySeatsFilled[categoryKey]++;
          allottedCat = categoryKey;
        } else {
          dept.smSeatsFilled++;
          dept.categorySeatsFilled.SM++;
          allottedCat = "SM";
        }
      }

      allotments.set(app.id, {
        ...app,
        allotmentStatus: "allotted",
        allottedDepartment: dept.name,
        allottedCategory: allottedCat
      });
    }

    // 2. Process non-admitted candidates (who are eligible)
    const eligibleRemaining = remainingApps.filter(isEligibleForAllotment);
    const sortedEligibleRemaining = sortByEducationThenRankThenMarks(eligibleRemaining);

    for (const app of sortedEligibleRemaining) {
      const choices = extractChoices(app);
      const categoryKey = getCategoryKey(app);
      let allotted = false;

      for (const choice of choices) {
        const dept = updatedDepartments.find(d => mapDepartmentNameToKey(d.name) === choice);
        if (!dept) continue;

        if (dept.filledSeats >= dept.totalSeats) continue;

        // Try SM
        if (dept.smSeatsFilled < dept.seatDistribution.SM) {
          dept.smSeatsFilled++;
          dept.filledSeats++;
          dept.categorySeatsFilled.SM++;
          dept.allottedStudents.push(app.id);
          allotments.set(app.id, {
            ...app,
            allotmentStatus: "allotted",
            allottedDepartment: dept.name,
            allottedCategory: "SM"
          });
          allotted = true;
          break;
        }

        // Try Reservation
        if (categoryKey && categoryKey !== "General" && dept.seatDistribution[categoryKey] > 0 &&
            dept.categorySeatsFilled[categoryKey] < dept.seatDistribution[categoryKey]) {
          dept.categorySeatsFilled[categoryKey]++;
          dept.filledSeats++;
          dept.allottedStudents.push(app.id);
          allotments.set(app.id, {
            ...app,
            allotmentStatus: "allotted",
            allottedDepartment: dept.name,
            allottedCategory: categoryKey
          });
          allotted = true;
          break;
        }
      }

      if (!allotted) {
        for (const choice of choices) {
          const dept = updatedDepartments.find(d => mapDepartmentNameToKey(d.name) === choice);
          if (!dept) continue;

          if (dept.filledSeats < dept.totalSeats) {
            dept.filledSeats++;
            dept.allottedStudents.push(app.id);
            allotments.set(app.id, {
              ...app,
              allotmentStatus: "allotted",
              allottedDepartment: dept.name,
              allottedCategory: "SM-Vacant"
            });
            allotted = true;
            break;
          }
        }
      }

      if (!allotted) {
        allotments.set(app.id, {
          ...app,
          allotmentStatus: "waiting_list",
          allottedDepartment: "Waiting List",
          allottedCategory: "seats_full"
        });
      }
    }

    // Map remaining as waiting or rejected
    const noExamApplications = [];
    remainingApps.forEach(app => {
      if (allotments.has(app.id)) return;
      
      const isMarkValid = parseFloat(app.mark) >= getMinMarkForCategory(app);
      const isDistanceValid = parseFloat(app.distance) <= MAX_DISTANCE;
      const isRankValid = isValidRank(app.letRank);
      
      if (isMarkValid && isDistanceValid && isRankValid) {
        const hasExperience = app.experience !== null && app.experience !== undefined && parseFloat(app.experience) >= MIN_EXPERIENCE;
        allotments.set(app.id, {
          ...app,
          allotmentStatus: "waiting_list",
          allottedDepartment: "Waiting List",
          allottedCategory: hasExperience ? "seats_full" : "experience_requirement"
        });
      } else {
        const isExamNotAttended = !isRankValid;
        const assignedDept = isExamNotAttended ? (Object.values(app.priorityChoices || {})[0] || "Waiting List") : null;
        
        const finalApp = {
          ...app,
          allotmentStatus: "not_eligible",
          allottedDepartment: assignedDept,
          allottedCategory: isExamNotAttended ? "exam_not_attended" : "eligibility_requirements"
        };
        allotments.set(app.id, finalApp);
        if (isExamNotAttended) {
          noExamApplications.push(finalApp);
        }
      }
    });

    const updatedApplications = Array.from(allotments.values());
    const summary = {
      allotted: updatedApplications.filter(a => a.allotmentStatus === "allotted").length,
      waiting_list: updatedApplications.filter(a => a.allotmentStatus === "waiting_list").length,
      not_eligible: updatedApplications.filter(a => a.allotmentStatus === "not_eligible").length,
      sm_allotted: updatedApplications.filter(a => a.allotmentStatus === "allotted" && a.allottedCategory === "SM").length,
      reservation_allotted: updatedApplications.filter(a => a.allotmentStatus === "allotted" && a.allottedCategory !== "SM").length,
    };

    // Filter out Waiting List from Department Wise Seat Status table
    const printableDepartments = updatedDepartments.filter(dept => dept.name !== "Waiting List");

    // --- GENERATE allotment.md ---
    console.log("Generating allotment.md...");
    let md = `# B.Tech Working Professionals Provisional Allotment List (2026)

This document contains the B.Tech provisional allotment and rank list results calculated for the **2026 B.Tech admissions** using the application data fetched from Firestore.

---

## Allotment Summary

| Category / Status | Count | Description |
| :--- | :---: | :--- |
| **Total Applications** | ${apps2026.length} | Total B.Tech applications received for 2026 |
| **Allotted (Seats)** | ${summary.allotted} | Successfully allotted a seat in one of the choices |
| **Waiting List** | ${summary.waiting_list} | Placed on the waiting list (insufficient rank/experience/quota) |
| **Not Eligible** | ${summary.not_eligible} | Did not meet basic criteria (distance/marks/etc.) |
| **State Merit (SM) Allotted** | ${summary.sm_allotted} | Allotted under State Merit (General Category) |
| **Reservation Allotted** | ${summary.reservation_allotted} | Allotted under a reserved category (EWS, EZ, M, LC, SC, etc.) |
| **Exam Not Attended** | ${noExamApplications.length} | Not eligible because they did not attend the LET exam |

---

## Department Wise Seat Status

| Department Name | Total Seats | Seats Filled | SM Seats Filled |
| :--- | :---: | :---: | :---: |
${printableDepartments.map(dept => `| **${dept.name}** | ${dept.totalSeats} | ${dept.filledSeats} | ${dept.smSeatsFilled} |`).join('\n')}

---

## Allotted Students List

Below is the list of all students who have been successfully allotted seats across different departments, sorted by department and candidate ranking.

`;

    const departmentsList = [
      "Computer Science and Engineering",
      "Electronics and Communication Engineering",
      "Mechanical Engineering"
    ];

    const getEducationPriority = (edu) => {
      const priorityMap = { 'BE': 1, 'BTech': 1, 'Diploma': 2, 'BSc': 3, 'BVoc': 4 };
      return priorityMap[edu] || 5;
    };

    departmentsList.forEach(deptName => {
      const allottedStudents = updatedApplications.filter(
        app => app.allotmentStatus === "allotted" && app.allottedDepartment === deptName
      );

      const sortedAllotted = sortAllottedList(allottedStudents);

      const deptDetails = updatedDepartments.find(d => d.name === deptName);
      md += `### ${deptName} (${allottedStudents.length} / ${deptDetails.totalSeats} seats filled)\n\n`;

      if (sortedAllotted.length === 0) {
        md += `*No students allotted to this department.*\n\n`;
      } else {
        md += `| Serial No. | Name | LET Rank | Allotment Quota | Email | Phone No. | Signature |\n`;
        md += `| :---: | :--- | :---: | :---: | :--- | :---: | :---: |\n`;
        sortedAllotted.forEach((student, index) => {
          md += `| ${index + 1} | **${student.name.trim()}** | ${student.letRank} | ${student.allottedCategory} | ${student.email} | ${student.phone} | | \n`;
        });
        md += `\n`;
      }
    });

    const waitingListStudents = updatedApplications.filter(
      app => app.allotmentStatus === "waiting_list"
    );

    waitingListStudents.sort((a, b) => {
      const epA = getEducationPriority(a.education);
      const epB = getEducationPriority(b.education);
      if (epA !== epB) return epA - epB;
      const rA = parseFloat(a.letRank) || 999999;
      const rB = parseFloat(b.letRank) || 999999;
      if (rA !== rB) return rA - rB;
      return (parseFloat(b.mark) || 0) - (parseFloat(a.mark) || 0);
    });

    md += `## Waiting List (${waitingListStudents.length} students)\n\n`;
    if (waitingListStudents.length === 0) {
      md += `*No students in the waiting list.*\n\n`;
    } else {
      md += `| Sl. No. | Name | LET Rank | Marks | Category | Reason / Status | Education | Distance | Experience |\n`;
      md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
      waitingListStudents.forEach((student, index) => {
        const reason = student.allottedCategory === "experience_requirement" ? "Insufficient Experience (<1 yr)" : "Seats Full";
        md += `| ${index + 1} | **${student.name}** | ${student.letRank} | ${student.mark}% | ${student.category || 'General'} | *${reason}* | ${student.education || 'Diploma'} | ${student.distance} km | ${student.experience === null || student.experience === undefined ? 'null' : student.experience} yrs |\n`;
      });
      md += `\n`;
    }

    const notEligibleStudents = updatedApplications.filter(
      app => app.allotmentStatus === "not_eligible"
    );

    md += `## Not Eligible / Rejected (${notEligibleStudents.length} students)\n\n`;
    if (notEligibleStudents.length === 0) {
      md += `*No rejected students.*\n\n`;
    } else {
      md += `| Sl. No. | Name | LET Rank | Marks | Category | Reason / Status | Education | Distance | Experience |\n`;
      md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
      notEligibleStudents.forEach((student, index) => {
        let reason = "Did not meet eligibility criteria";
        if (student.allottedCategory === "exam_not_attended") {
          reason = "LET Exam Not Attended";
        } else {
          const isMarkInvalid = parseFloat(student.mark) < (student.category ? 40 : 45);
          const isDistanceInvalid = parseFloat(student.distance) > 70;
          const isRankInvalid = !student.letRank || student.letRank === "NA";
          const isExperienceInvalid = student.experience === null || student.experience === undefined || parseFloat(student.experience) < 1;
          
          const reasons = [];
          if (isMarkInvalid) reasons.push("Low Marks");
          if (isDistanceInvalid) reasons.push("Distance > 70km");
          if (isRankInvalid) reasons.push("Invalid LET Rank");
          if (isExperienceInvalid) reasons.push("Insufficient Experience");
          if (reasons.length > 0) reason = reasons.join(" & ");
        }
        md += `| ${index + 1} | **${student.name}** | ${student.letRank} | ${student.mark}% | ${student.category || 'General'} | *${reason}* | ${student.education || 'Diploma'} | ${student.distance} km | ${student.experience === null || student.experience === undefined ? 'null' : student.experience} yrs |\n`;
      });
      md += `\n`;
    }

    fs.writeFileSync('allotment.md', md);
    console.log("allotment.md regenerated.");

    // --- GENERATE allotment.pdf ---
    console.log("Generating allotment.pdf...");
    const pdfDoc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = 297;
    const pageHeight = 210;
    let y = 15;

    const drawCell = (doc, text, x, y, w, h, align = "center", isBold = false, fontSize = 9) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      doc.rect(x, y, w, h); // Draw border
      
      const cleanText = text !== undefined && text !== null ? String(text).trim() : "";
      const textY = y + (h / 2) + (fontSize * 0.35 / 2);
      
      if (align === "left") {
        const textX = x + 3;
        let truncatedText = cleanText;
        const maxWidth = w - 6;
        if (doc.getTextWidth(truncatedText) > maxWidth) {
          while (truncatedText.length > 0 && doc.getTextWidth(truncatedText + "..") > maxWidth) {
            truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          }
          truncatedText += "..";
        }
        doc.text(truncatedText, textX, textY);
      } else {
        const textX = x + w / 2;
        let truncatedText = cleanText;
        const maxWidth = w - 4;
        if (doc.getTextWidth(truncatedText) > maxWidth) {
          while (truncatedText.length > 0 && doc.getTextWidth(truncatedText + "..") > maxWidth) {
            truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          }
          truncatedText += "..";
        }
        doc.text(truncatedText, textX, textY, { align: "center" });
      }
    };

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - 15) {
        pdfDoc.addPage();
        y = 15;
        drawPageHeader();
      }
    };

    const drawPageHeader = () => {
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(120, 120, 120);
      pdfDoc.text("COLLEGE OF ENGINEERING TRIVANDRUM", 15, 10);
      pdfDoc.text("B.TECH ADMISSIONS 2026", 240, 10);
      pdfDoc.line(15, 12, 282, 12);
      y = Math.max(y, 18);
    };

    drawPageHeader();

    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(14);
    pdfDoc.setTextColor(0, 0, 0);
    pdfDoc.text("B.Tech Working Professionals Provisional Allotment List (2026)", 15, y + 8);
    y += 18;

    pdfDoc.setFont("helvetica", "italic");
    pdfDoc.setFontSize(10);
    pdfDoc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, y);
    y += 8;

    // Summary Section
    checkPageBreak(55);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(12);
    pdfDoc.text("1. Allotment Summary", 15, y);
    y += 6;
    pdfDoc.line(15, y, 282, y);
    y += 6;

    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.setFontSize(10);
    const summaryItems = [
      ["Total B.Tech Applications", `${apps2026.length}`],
      ["Total Seats Allotted", `${summary.allotted}`],
      ["Waiting List Candidates", `${summary.waiting_list}`],
      ["Not Eligible / Rejected", `${summary.not_eligible}`]
    ];
    summaryItems.forEach(item => {
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.text(item[0], 15, y);
      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.text(item[1], 100, y);
      y += 6;
    });
    y += 6;

    // Department Seat Status Section
    checkPageBreak(55);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(12);
    pdfDoc.text("2. Department Seat Status", 15, y);
    y += 6;
    pdfDoc.line(15, y, 282, y);
    y += 6;

    drawCell(pdfDoc, "Department Name", 15, y, 120, 8, "left", true, 9);
    drawCell(pdfDoc, "Total Seats", 135, y, 40, 8, "center", true, 9);
    drawCell(pdfDoc, "Seats Filled", 175, y, 40, 8, "center", true, 9);
    drawCell(pdfDoc, "SM Seats Filled", 215, y, 40, 8, "center", true, 9);
    y += 8;

    printableDepartments.forEach(dept => {
      drawCell(pdfDoc, dept.name, 15, y, 120, 8, "left", false, 9);
      drawCell(pdfDoc, `${dept.totalSeats}`, 135, y, 40, 8, "center", false, 9);
      drawCell(pdfDoc, `${dept.filledSeats}`, 175, y, 40, 8, "center", false, 9);
      drawCell(pdfDoc, `${dept.smSeatsFilled}`, 215, y, 40, 8, "center", false, 9);
      y += 8;
    });
    y += 6;

    // Allotted Students List Section
    checkPageBreak(30);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.setFontSize(12);
    pdfDoc.text("3. Allotted Students List (Attendance Registers)", 15, y);
    y += 6;
    pdfDoc.line(15, y, 282, y);
    y += 8;

    departmentsList.forEach((deptName, deptIdx) => {
      const allottedStudents = updatedApplications.filter(
        app => app.allotmentStatus === "allotted" && app.allottedDepartment === deptName
      );

      const sortedAllotted = sortAllottedList(allottedStudents);

      // Start each department on a fresh page
      pdfDoc.addPage();
      let currentY = 12;
      const rowHeight = 8;

      const drawDepartmentGridHeader = (yPos) => {
        // Row 1: Merged title
        drawCell(pdfDoc, "COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", 10, yPos, 277, 10, "center", true, 11);
        // Row 2: Merged stream
        drawCell(pdfDoc, `STREAM: ${deptName.toUpperCase()}`, 10, yPos + 10, 277, 8, "center", true, 10);
        // Row 3: Headers
        const headerY = yPos + 18;
        drawCell(pdfDoc, "Serial No.", 10, headerY, 20, 8, "center", true, 9);
        drawCell(pdfDoc, "Name", 30, headerY, 65, 8, "center", true, 9);
        drawCell(pdfDoc, "LET Rank", 95, headerY, 25, 8, "center", true, 9);
        drawCell(pdfDoc, "Allotment Quota", 120, headerY, 35, 8, "center", true, 9);
        drawCell(pdfDoc, "Email", 155, headerY, 60, 8, "center", true, 9);
        drawCell(pdfDoc, "Phone No.", 215, headerY, 37, 8, "center", true, 9);
        drawCell(pdfDoc, "Signature", 252, headerY, 35, 8, "center", true, 9);
      };

      const checkPdfPageBreak = (neededHeight) => {
        if (currentY + neededHeight > pageHeight - 12) {
          pdfDoc.addPage();
          currentY = 12;
          drawDepartmentGridHeader(currentY);
          currentY += 26;
        }
      };

      drawDepartmentGridHeader(currentY);
      currentY += 26;

      if (sortedAllotted.length === 0) {
        checkPdfPageBreak(rowHeight);
        drawCell(pdfDoc, "No students allotted.", 10, currentY, 277, rowHeight, "center", false, 9);
        currentY += rowHeight;
      } else {
        sortedAllotted.forEach((student, index) => {
          checkPdfPageBreak(rowHeight);
          drawCell(pdfDoc, `${index + 1}`, 10, currentY, 20, rowHeight, "center", false, 8);
          drawCell(pdfDoc, student.name, 30, currentY, 65, rowHeight, "left", false, 8);
          drawCell(pdfDoc, `${student.letRank}`, 95, currentY, 25, rowHeight, "center", false, 8);
          drawCell(pdfDoc, student.allottedCategory || "", 120, currentY, 35, rowHeight, "center", false, 8);
          drawCell(pdfDoc, student.email || "", 155, currentY, 60, rowHeight, "left", false, 8);
          drawCell(pdfDoc, student.phone || "", 215, currentY, 37, rowHeight, "center", false, 8);
          drawCell(pdfDoc, "", 252, currentY, 35, rowHeight, "center", false, 8);
          currentY += rowHeight;
        });
      }
    });

    // Waiting List Section
    const drawWaitingListHeader = (yPos) => {
      drawCell(pdfDoc, "COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", 10, yPos, 277, 10, "center", true, 11);
      drawCell(pdfDoc, "STREAM: WAITING LIST", 10, yPos + 10, 277, 8, "center", true, 10);
      
      const headerY = yPos + 18;
      drawCell(pdfDoc, "Serial No.", 10, headerY, 20, 8, "center", true, 9);
      drawCell(pdfDoc, "Name", 30, headerY, 65, 8, "center", true, 9);
      drawCell(pdfDoc, "LET Rank", 95, headerY, 25, 8, "center", true, 9);
      drawCell(pdfDoc, "Reason", 120, headerY, 35, 8, "center", true, 9);
      drawCell(pdfDoc, "Email", 155, headerY, 60, 8, "center", true, 9);
      drawCell(pdfDoc, "Phone No.", 215, headerY, 37, 8, "center", true, 9);
      drawCell(pdfDoc, "Signature", 252, headerY, 35, 8, "center", true, 9);
    };

    pdfDoc.addPage();
    let wlY = 12;
    const rowHeight = 8;
    
    const checkWlPageBreak = (neededHeight) => {
      if (wlY + neededHeight > pageHeight - 12) {
        pdfDoc.addPage();
        wlY = 12;
        drawWaitingListHeader(wlY);
        wlY += 26;
      }
    };

    drawWaitingListHeader(wlY);
    wlY += 26;

    if (waitingListStudents.length === 0) {
      checkWlPageBreak(rowHeight);
      drawCell(pdfDoc, "No students in the waiting list.", 10, wlY, 277, rowHeight, "center", false, 9);
      wlY += rowHeight;
    } else {
      waitingListStudents.forEach((student, index) => {
        checkWlPageBreak(rowHeight);
        const reason = student.allottedCategory === "experience_requirement" ? "Insufficient Exp" : "Seats Full";
        
        drawCell(pdfDoc, `${index + 1}`, 10, wlY, 20, rowHeight, "center", false, 8);
        drawCell(pdfDoc, student.name, 30, wlY, 65, rowHeight, "left", false, 8);
        drawCell(pdfDoc, `${student.letRank}`, 95, wlY, 25, rowHeight, "center", false, 8);
        drawCell(pdfDoc, reason, 120, wlY, 35, rowHeight, "center", false, 8);
        drawCell(pdfDoc, student.email || "", 155, wlY, 60, rowHeight, "left", false, 8);
        drawCell(pdfDoc, student.phone || "", 215, wlY, 37, rowHeight, "center", false, 8);
        drawCell(pdfDoc, "", 252, wlY, 35, rowHeight, "center", false, 8);
        
        wlY += rowHeight;
      });
    }

    // Not Eligible / Rejected Section
    const drawNotEligibleHeader = (yPos) => {
      drawCell(pdfDoc, "COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", 10, yPos, 277, 10, "center", true, 11);
      drawCell(pdfDoc, "NOT ELIGIBLE / REJECTED CANDIDATES (2026)", 10, yPos + 10, 277, 8, "center", true, 10);
      
      const headerY = yPos + 18;
      drawCell(pdfDoc, "Sl. No.", 10, headerY, 15, 8, "center", true, 9);
      drawCell(pdfDoc, "Student Name", 25, headerY, 55, 8, "center", true, 9);
      drawCell(pdfDoc, "LET Rank", 80, headerY, 20, 8, "center", true, 9);
      drawCell(pdfDoc, "Marks", 100, headerY, 18, 8, "center", true, 9);
      drawCell(pdfDoc, "Category", 118, headerY, 25, 8, "center", true, 9);
      drawCell(pdfDoc, "Reason / Status", 143, headerY, 50, 8, "center", true, 9);
      drawCell(pdfDoc, "Education", 193, headerY, 25, 8, "center", true, 9);
      drawCell(pdfDoc, "Distance", 218, headerY, 25, 8, "center", true, 9);
      drawCell(pdfDoc, "Experience", 243, headerY, 44, 8, "center", true, 9);
    };

    pdfDoc.addPage();
    let neY = 12;
    const checkNePageBreak = (neededHeight) => {
      if (neY + neededHeight > pageHeight - 12) {
        pdfDoc.addPage();
        neY = 12;
        drawNotEligibleHeader(neY);
        neY += 26;
      }
    };

    drawNotEligibleHeader(neY);
    neY += 26;

    if (notEligibleStudents.length === 0) {
      checkNePageBreak(rowHeight);
      drawCell(pdfDoc, "No rejected students.", 10, neY, 277, rowHeight, "center", false, 9);
      neY += rowHeight;
    } else {
      notEligibleStudents.forEach((student, index) => {
        checkNePageBreak(rowHeight);
        
        let reason = "Did not meet eligibility criteria";
        if (student.allottedCategory === "exam_not_attended") {
          reason = "LET Exam Not Attended";
        } else {
          const isMarkInvalid = parseFloat(student.mark) < (student.category ? 40 : 45);
          const isDistanceInvalid = parseFloat(student.distance) > 70;
          const isRankInvalid = !student.letRank || student.letRank === "NA";
          const isExperienceInvalid = student.experience === null || student.experience === undefined || parseFloat(student.experience) < 1;
          
          const reasons = [];
          if (isMarkInvalid) reasons.push("Low Marks");
          if (isDistanceInvalid) reasons.push("Distance > 70km");
          if (isRankInvalid) reasons.push("Invalid LET Rank");
          if (isExperienceInvalid) reasons.push("Insufficient Experience");
          if (reasons.length > 0) reason = reasons.join(" & ");
        }

        drawCell(pdfDoc, `${index + 1}`, 10, neY, 15, 8, "center", false, 8);
        drawCell(pdfDoc, student.name, 25, neY, 55, 8, "left", false, 8);
        drawCell(pdfDoc, `${student.letRank}`, 80, neY, 20, 8, "center", false, 8);
        drawCell(pdfDoc, `${student.mark}%`, 100, neY, 18, 8, "center", false, 8);
        drawCell(pdfDoc, student.category || 'General', 118, neY, 25, 8, "center", false, 8);
        drawCell(pdfDoc, reason, 143, neY, 50, 8, "left", false, 8);
        drawCell(pdfDoc, student.education || 'Diploma', 193, neY, 25, 8, "center", false, 8);
        drawCell(pdfDoc, `${student.distance} km`, 218, neY, 25, 8, "center", false, 8);
        drawCell(pdfDoc, `${student.experience === null || student.experience === undefined ? 'null' : student.experience} yrs`, 243, neY, 44, 8, "center", false, 8);
        
        neY += rowHeight;
      });
    }

    const pdfData = pdfDoc.output();
    fs.writeFileSync('allotment.pdf', pdfData, 'binary');
    console.log("allotment.pdf written.");

    // --- GENERATE SEPARATE EXCEL FILES FOR EACH DEPARTMENT ---
    departmentsList.forEach((deptName) => {
      console.log(`Generating Excel file for ${deptName}...`);
      const deptWorkbook = XLSX.utils.book_new();

      const allottedStudents = updatedApplications.filter(
        app => app.allotmentStatus === "allotted" && app.allottedDepartment === deptName
      );

      const sortedAllotted = sortAllottedList(allottedStudents);

      const rows = [
        ["COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", "", "", "", "", "", ""],
        [`STREAM: ${deptName.toUpperCase()}`, "", "", "", "", "", ""],
        ["Serial No.", "Name", "LET Rank", "Allotment Quota", "Email", "Phone No.", "Signature"]
      ];

      sortedAllotted.forEach((student, index) => {
        rows.push([
          index + 1,
          student.name.trim(),
          student.letRank,
          student.allottedCategory,
          student.email,
          student.phone,
          "" // Signature
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Merge A1:G1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Merge A2:G2
      ];

      ws['!cols'] = [
        { wch: 10 }, // Serial No.
        { wch: 30 }, // Name
        { wch: 12 }, // LET Rank
        { wch: 18 }, // Allotment Quota
        { wch: 30 }, // Email
        { wch: 15 }, // Phone No.
        { wch: 15 }  // Signature
      ];

      ws['!pageSetup'] = { orientation: 'landscape' };

      const sheetName = deptName === "Computer Science and Engineering" ? "CSE"
        : deptName === "Electronics and Communication Engineering" ? "ECE"
        : "Mechanical";

      XLSX.utils.book_append_sheet(deptWorkbook, ws, sheetName);

      const fileName = `${deptName.replace(/\s+/g, '_')}_Allotment.xlsx`;
      XLSX.writeFile(deptWorkbook, fileName);
      console.log(`${fileName} written.`);
    });

    // --- GENERATE SEPARATE EXCEL FILE FOR WAITING LIST ---
    console.log("Generating Excel file for Waiting List...");
    const wlWorkbook = XLSX.utils.book_new();

    const wlRows = [
      ["COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", "", "", "", "", "", ""],
      ["STREAM: WAITING LIST", "", "", "", "", "", ""],
      ["Serial No.", "Name", "LET Rank", "Reason", "Email", "Phone No.", "Signature"]
    ];

    waitingListStudents.forEach((student, index) => {
      const reason = student.allottedCategory === "experience_requirement" ? "Insufficient Exp" : "Seats Full";
      wlRows.push([
        index + 1,
        student.name.trim(),
        student.letRank,
        reason,
        student.email,
        student.phone,
        "" // Signature
      ]);
    });

    const wsWl = XLSX.utils.aoa_to_sheet(wlRows);
    wsWl['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Merge A1:G1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Merge A2:G2
    ];
    wsWl['!cols'] = [
      { wch: 10 }, // Serial No.
      { wch: 30 }, // Name
      { wch: 12 }, // LET Rank
      { wch: 18 }, // Reason
      { wch: 30 }, // Email
      { wch: 15 }, // Phone No.
      { wch: 15 }  // Signature
    ];
    wsWl['!pageSetup'] = { orientation: 'landscape' };
    XLSX.utils.book_append_sheet(wlWorkbook, wsWl, "Waiting List");

    XLSX.writeFile(wlWorkbook, "Waiting_List.xlsx");
    console.log("Waiting_List.xlsx written.");

    // --- GENERATE SEPARATE EXCEL FILE FOR NOT ELIGIBLE ---
    console.log("Generating Excel file for Not Eligible...");
    const neWorkbook = XLSX.utils.book_new();

    const neRows = [
      ["COLLEGE OF ENGINEERING TRIVANDRUM Office of the Programs for Working Professionals", "", "", "", "", "", "", "", ""],
      ["NOT ELIGIBLE / REJECTED CANDIDATES (2026)", "", "", "", "", "", "", "", ""],
      ["Sl. No.", "Student Name", "LET Rank", "Marks", "Category", "Reason / Status", "Education", "Distance", "Experience"]
    ];

    notEligibleStudents.forEach((student, index) => {
      let reason = "Did not meet eligibility criteria";
      if (student.allottedCategory === "exam_not_attended") {
        reason = "LET Exam Not Attended";
      } else {
        const isMarkInvalid = parseFloat(student.mark) < (student.category ? 40 : 45);
        const isDistanceInvalid = parseFloat(student.distance) > 70;
        const isRankInvalid = !student.letRank || student.letRank === "NA";
        const isExperienceInvalid = student.experience === null || student.experience === undefined || parseFloat(student.experience) < 1;
        
        const reasons = [];
        if (isMarkInvalid) reasons.push("Low Marks");
        if (isDistanceInvalid) reasons.push("Distance > 70km");
        if (isRankInvalid) reasons.push("Invalid LET Rank");
        if (isExperienceInvalid) reasons.push("Insufficient Experience");
        if (reasons.length > 0) reason = reasons.join(" & ");
      }
      neRows.push([
        index + 1,
        student.name,
        student.letRank,
        `${student.mark}%`,
        student.category || 'General',
        reason,
        student.education || 'Diploma',
        `${student.distance} km`,
        student.experience === null || student.experience === undefined ? 'null' : `${student.experience} yrs`
      ]);
    });

    const wsNe = XLSX.utils.aoa_to_sheet(neRows);
    wsNe['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
    ];
    wsNe['!cols'] = [
      { wch: 8 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    wsNe['!pageSetup'] = { orientation: 'landscape' };
    XLSX.utils.book_append_sheet(neWorkbook, wsNe, "Not Eligible");

    XLSX.writeFile(neWorkbook, "Not_Eligible.xlsx");
    console.log("Not_Eligible.xlsx written.");

    process.exit(0);
  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

main();

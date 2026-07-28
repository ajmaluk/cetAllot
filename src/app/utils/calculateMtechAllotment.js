export const calculateMtechAllotment = (applications) => {
  const specializations = {
    "Control Systems (Electrical Engineering)": { totalSeats: 15, allotted: [] },
    "Thermal Science (Mechanical Engineering)": { totalSeats: 15, allotted: [] },
    "Traffic & Transportation Engineering (Civil Engineering)": { totalSeats: 15, allotted: [] },
  };

  const updatedApplications = [];
  const waitingListArray = [];

  // Filter out any non-eligible applications and sort eligible candidates
  applications.forEach((app) => {
    const mark = Number(app.btechMark) || 0;
    const experience = Number(app.experience) || 0;
    const distance = Number(app.distance) || 0;

    const specKey = app.specialization;
    const spec = specializations[specKey];

    if (!spec) {
      waitingListArray.push({
        ...app,
        allotmentStatus: "not_eligible",
        allottedDepartment: "Waiting List",
        allottedCategory: "invalid_specialization",
      });
      return;
    }

    // Determine category based eligibility
    const category = app.reservationCategory || app.category || "General";
    const isSCST = category === "SC" || category === "ST";
    const sebcCategories = [
      "Ezhava", "Muslim", "Other Backward Hindu", "Latin Catholic and Anglo Indian", 
      "Dheevara", "Viswakarma", "Kusavan", "OBC Christian", "Kudumbi"
    ];
    const isSEBC = sebcCategories.includes(category);

    let minMark = 60;
    if (isSCST) {
      minMark = 0; // Pass is sufficient for SC/ST
    } else if (isSEBC) {
      minMark = 55;
    }

    const validMark = mark >= minMark;
    const validExperience = experience >= 1;
    const validDistance = distance <= 75;

    const isEligible = validMark && validExperience && validDistance;

    if (!isEligible) {
      const reason = !validMark ? "minimum_mark_requirement"
        : !validExperience ? "experience_requirement"
        : "distance_exceeds_limit";
      waitingListArray.push({
        ...app,
        allotmentStatus: "not_eligible",
        allottedDepartment: "Waiting List",
        allottedCategory: reason,
      });
      return;
    }

    spec.allotted.push(app);
  });

  const getIndexMark = (x) => {
    const bMark = Number(x.btechMark) || 0;
    const exp = Number(x.experience) || 0;
    const expWeightage = exp >= 1 ? Math.min(20, exp * 2) : 0;
    return bMark + expWeightage;
  };

  // Sort candidates within each specialization and allocate seats
  for (const [specName, spec] of Object.entries(specializations)) {
    spec.allotted.sort((a, b) => {
      const indexA = getIndexMark(a);
      const indexB = getIndexMark(b);

      if (indexB !== indexA) {
        return indexB - indexA; // Higher index mark gets preference
      }

      // Tie-breaker 1: B.Tech Marks (descending)
      const markA = Number(a.btechMark) || 0;
      const markB = Number(b.btechMark) || 0;
      if (markB !== markA) {
        return markB - markA;
      }

      // Tie-breaker 2: Age (descending, older candidate first)
      const ageA = Number(a.age) || 0;
      const ageB = Number(b.age) || 0;
      if (ageB !== ageA) {
        return ageB - ageA;
      }

      // Tie-breaker 3: Distance (descending)
      const distA = Number(a.distance) || 0;
      const distB = Number(b.distance) || 0;
      return distB - distA;
    });

    const seatCount = spec.totalSeats;
    const allottedStudents = spec.allotted.slice(0, seatCount);
    const overflowStudents = spec.allotted.slice(seatCount);

    allottedStudents.forEach((app, idx) => {
      const indexMark = getIndexMark(app);
      updatedApplications.push({
        ...app,
        allotmentStatus: "allotted",
        allottedDepartment: specName,
        allottedCategory: app.reservationCategory || "General",
        indexMark: Number(indexMark.toFixed(2)),
        rank: idx + 1,
      });
    });

    overflowStudents.forEach((app) => {
      const indexMark = getIndexMark(app);
      waitingListArray.push({
        ...app,
        allotmentStatus: "waiting_list",
        allottedDepartment: "Waiting List",
        allottedCategory: "no_seat_available",
        indexMark: Number(indexMark.toFixed(2)),
      });
    });
  }

  // Assign ranks for waiting list students
  waitingListArray.forEach((app, idx) => {
    updatedApplications.push({
      ...app,
      rank: idx + 1,
    });
  });

  const updatedDepartments = [
    { name: "Control Systems (Electrical Engineering)", totalSeats: 15 },
    { name: "Thermal Science (Mechanical Engineering)", totalSeats: 15 },
    { name: "Traffic & Transportation Engineering (Civil Engineering)", totalSeats: 15 },
    { name: "Waiting List", totalSeats: 0 },
  ];

  return { updatedApplications, updatedDepartments };
};

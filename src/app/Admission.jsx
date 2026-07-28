import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Clock, Briefcase, Calendar,
  Building, Aperture, BookOpen, GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { motion, useScroll, useTransform } from "framer-motion";
import { SkeletonTable } from "@/components/ui/Skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import AllottedTable from "./admin/Allotment/AllottedTable";
import AllottedNoTable from "./admin/Allotment/AllottedNoTable";

export default function PartTimeBtech() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [degreeType, setDegreeType] = useState("mtech");
  const [isPublished, setIsPublished] = useState(false);
  const [isSpotPublished, setIsSpotPublished] = useState(false);
  const [allotmentSubTab, setAllotmentSubTab] = useState("regular"); // "regular" | "spot"
  const [allottedData, setAllottedData] = useState({});
  const [allottedData2, setAllottedData2] = useState({});
  const [loading, setLoading] = useState(true);

  const getDepartmentsForYear = (year) => {
    return year === "2025"
      ? [
          "Civil Engineering",
          "Electrical and Electronics Engineering",
          "Mechanical Engineering",
          "Waiting List",
        ]
      : [
          "Computer Science and Engineering",
          "Electronics and Communication Engineering",
          "Mechanical Engineering",
          "Waiting List",
        ];
  };

  const getMtechSpecializations = () => [
    "Control Systems (Electrical Engineering)",
    "Thermal Science (Mechanical Engineering)",
    "Traffic & Transportation Engineering (Civil Engineering)",
    "Waiting List",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (degreeType === "mtech") {
          let published = false;
          const publishRef = doc(db, "mtech_allotment", `publishStatus_${selectedYear}`);
          const publishSnap = await getDoc(publishRef);
          if (publishSnap.exists()) {
            published = !!publishSnap.data().published;
          }
          setIsPublished(published);

          if (!published) {
            setAllottedData({});
            setAllottedData2({});
            return;
          }

          const specializations = getMtechSpecializations();
          const data = {};

          for (const spec of specializations) {
            const snapshot = await getDocs(collection(db, `mtech_allotment/${spec}_${selectedYear}/students`));
            const students = [];
            snapshot.forEach((doc) => students.push({ id: doc.id, ...doc.data() }));
            data[spec] = students;
          }
          setAllottedData(data);
          setAllottedData2({});
          return;
        }

        let published = false;
        let spotPublished = false;

        const spotPublishRef = doc(db, "spot_allotment", `publishStatus_${selectedYear}`);
        const spotPublishSnap = await getDoc(spotPublishRef);
        if (spotPublishSnap.exists()) {
          spotPublished = !!spotPublishSnap.data().published;
        }
        setIsSpotPublished(spotPublished);

        const publishRef = doc(db, "allotment", `publishStatus_${selectedYear}`);
        const publishSnap = await getDoc(publishRef);

        if (publishSnap.exists()) {
          published = !!publishSnap.data().published;
        } else if (selectedYear === "2025") {
          const legacySnap = await getDoc(doc(db, "allotment", "publishStatus"));
          published = legacySnap.exists() && legacySnap.data().published;
        }

        setIsPublished(published);

        // Adjust default sub-tab based on publication status
        let activeSubTab = allotmentSubTab;
        if (!published && spotPublished && allotmentSubTab === "regular") {
          activeSubTab = "spot";
          setAllotmentSubTab("spot");
        } else if (published && !spotPublished && allotmentSubTab === "spot") {
          activeSubTab = "regular";
          setAllotmentSubTab("regular");
        }

        const isCurrentTabPublished = degreeType === "mtech" 
          ? published 
          : (activeSubTab === "spot" ? spotPublished : published);

        if (!isCurrentTabPublished) {
          setAllottedData({});
          setAllottedData2({});
          return;
        }

        const depts = getDepartmentsForYear(selectedYear);
        const data = {};
        const data2 = {};
        const baseCollection = activeSubTab === "spot" ? "spot_allotment" : "allotment";
        const baseNoExamCollection = activeSubTab === "spot" ? "spot_no_exam_allotment" : "no_exam_allotment";

        for (const dept of depts) {
          let snapshot = await getDocs(collection(db, `${baseCollection}/${dept}_${selectedYear}/students`));
          let snapshot2 = await getDocs(collection(db, `${baseNoExamCollection}/${dept}_${selectedYear}/students`));

          if (selectedYear === "2025" && baseCollection === "allotment" && snapshot.empty && snapshot2.empty) {
            snapshot = await getDocs(collection(db, `allotment/${dept}/students`));
            snapshot2 = await getDocs(collection(db, `no_exam_allotment/${dept}/students`));
          }

          const students = [];
          const students2 = [];

          snapshot.forEach((doc) => students.push({ id: doc.id, ...doc.data() }));
          snapshot2.forEach((doc) => students2.push({ id: doc.id, ...doc.data() }));

          const sortFn = (a, b) => {
            const rankA = parseFloat(a.letRank);
            const rankB = parseFloat(b.letRank);
            const hasRankA = !isNaN(rankA) && rankA > 0;
            const hasRankB = !isNaN(rankB) && rankB > 0;

            if (hasRankA && !hasRankB) return -1;
            if (!hasRankA && hasRankB) return 1;

            if (hasRankA && hasRankB) {
              if (rankA !== rankB) return rankA - rankB;
            }

            const distA = parseFloat(a.distance) || 0;
            const distB = parseFloat(b.distance) || 0;
            if (distB !== distA) return distB - distA;

            const markA = parseFloat(a.mark) || 0;
            const markB = parseFloat(b.mark) || 0;
            return markB - markA;
          };
          students.sort(sortFn);
          students2.sort(sortFn);

          data[dept] = students;
          data2[dept] = students2;
        }
        setAllottedData(data);
        setAllottedData2(data2);
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear, degreeType, allotmentSubTab]);

  const formatDeptName = (name) => {
    if (name === "Electrical and Electronics Engineering") return "Electrical & Electronics Engineering";
    return name;
  };

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      <div className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-4xl mx-auto text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
            {degreeType === "btech" 
              ? `B.Tech Working Professionals Provisional Allotment List (${selectedYear})`
              : `M.Tech Admission Results (${selectedYear})`}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            View your admission status for the Working Professionals program at <span className="whitespace-nowrap">College of Engineering Trivandrum.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Tabs value={degreeType} onValueChange={setDegreeType} className="w-full max-w-md mx-auto">
              <TabsList className="bg-muted/50 p-1 rounded-xl w-full">
                <TabsTrigger
                  value="btech"
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  B.Tech
                </TabsTrigger>
                <TabsTrigger
                  value="mtech"
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                >
                  M.Tech
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px] shadow-sm bg-card border border-border/80 rounded-xl px-4 py-2 hover:bg-muted/30 transition-colors font-medium">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                <SelectItem value="2026" className="rounded-lg">2026</SelectItem>
                <SelectItem value="2025" className="rounded-lg">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                <p className="text-sm font-medium">Checking admission status...</p>
              </div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonTable key={i} rows={4} columns={5} />
            ))}
          </div>
        ) : (isPublished || isSpotPublished) ? (
          <div className="space-y-8">
            {degreeType === "btech" && (isPublished || isSpotPublished) && (
              <div className="flex justify-center mb-8">
                <Tabs value={allotmentSubTab} onValueChange={setAllotmentSubTab} className="w-full max-w-xs mx-auto">
                  <TabsList className="bg-muted/50 p-1 rounded-xl w-full">
                    <TabsTrigger
                      value="regular"
                      className="flex-1 px-4 py-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                    >
                      Regular Allotment
                    </TabsTrigger>
                    {isSpotPublished && (
                      <TabsTrigger
                        value="spot"
                        className="flex-1 px-4 py-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
                      >
                        Spot Allotment
                      </TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Check if currently selected sub-tab is published */}
            {((degreeType === "btech" && allotmentSubTab === "regular" && !isPublished) ||
              (degreeType === "btech" && allotmentSubTab === "spot" && !isSpotPublished) ||
              (degreeType === "mtech" && !isPublished)) ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Results Not Yet Published</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {allotmentSubTab === "spot"
                    ? "Spot allotment results will be published here once the process is complete."
                    : "Admission results will be published here once the allotment process is complete."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Notice */}
                <div className="flex items-start gap-3 p-5 rounded-xl border-l-4 border-amber-500 bg-amber-50 text-amber-800 text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Important Note</p>
                    <p className="mt-1">
                      This is a <strong>provisional allotment</strong> only. Inclusion in this list does not guarantee admission.
                      Candidates with higher marks appearing physically during admission will be given preference.
                      Admission is confirmed only on payment of full fees and successful document verification.
                    </p>
                  </div>
                </div>

                {degreeType === "mtech" ? (
                  <>
                    {getMtechSpecializations().map((spec) => (
                      <AllottedTable
                        key={spec}
                        students={allottedData[spec] || []}
                        deptName={spec}
                        hideMobile={true}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {getDepartmentsForYear(selectedYear).map((dept) => (
                      <AllottedTable
                        key={dept}
                        students={allottedData[dept] || []}
                        deptName={formatDeptName(dept)}
                        hideMobile={true}
                      />
                    ))}

                    <div className="pt-8 mt-8 border-t border-border">
                      <h2 className="text-3xl font-bold text-center text-primary mb-4">
                        {allotmentSubTab === "spot" ? "Spot Allotment Results: Non-LET Candidates" : "Allotment Results: Non-LET Candidates"}
                      </h2>
                      <div className="flex items-start gap-3 p-5 rounded-xl border-l-4 border-blue-500 bg-blue-50 text-blue-800 text-sm mb-8">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p>
                          <strong>Note:</strong> Allotment for non-LET candidates follows the official reservation policy.
                          Students belonging to reservation categories are considered first in their respective quotas.
                          General category candidates are considered only after reserved seats are filled.
                          Inclusion in this list does not guarantee admission.
                        </p>
                      </div>
                      {getDepartmentsForYear(selectedYear).map((dept) => (
                        <AllottedNoTable
                          key={dept}
                          students={allottedData2[dept] || []}
                          deptName={formatDeptName(dept)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Results Not Yet Published</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {degreeType === "mtech"
                ? "M.Tech admission results will be published here once the allotment process is complete. Please check back later."
                : "Admission results will be published here once the allotment process is complete. Please check back later."}
            </p>
          </div>
        )}

        {/* Program Highlights */}
        <motion.div
          style={{ y }}
          className="relative bg-gradient-to-br from-primary/[0.03] to-blue-500/[0.03] rounded-2xl p-8 md:p-12 mb-16 overflow-hidden mt-20"
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-10 text-center">Program Highlights</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: "Working Professionals",
                  description: "Designed for employed graduates seeking advanced specialization",
                  icon: <Briefcase className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Evening Classes",
                  description: "5:45 PM to 9:15 PM on weekdays",
                  icon: <Clock className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Duration",
                  description: degreeType === "mtech"
                    ? "2-year program (4 semesters) following KTU syllabus"
                    : "3-year program (6 semesters) following KTU syllabus",
                  icon: <Calendar className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Eligibility",
                  description: (
                    <div className="space-y-2 text-xs">
                      {degreeType === "mtech" ? (
                        <>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">B.Tech</span>
                            <span>B.Tech/BE/AMIE/AMIETE with min 60% marks (55% for SEBC, Pass for SC/ST).</span>
                          </div>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">Experience</span>
                            <span>Min 1 year of professional experience after qualifying exam.</span>
                          </div>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">Distance</span>
                            <span>Workplace must be within 75 km from CET.</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">Diploma</span>
                            <span>Diploma in Engineering/Technology with at least 45% marks (40% for reserved).</span>
                          </div>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">B.Sc. Degree</span>
                            <span>B.Sc. with min 45% marks (40% for reserved) and 10+2 Mathematics.</span>
                          </div>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold mr-1">D.Voc. Stream</span>
                            <span>D.Voc. in the same or allied sector.</span>
                          </div>
                        </>
                      )}
                    </div>
                  ),
                  icon: <BookOpen className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Specializations",
                  description: degreeType === "mtech"
                    ? "Control Systems, Thermal Science, Traffic & Transportation Engineering"
                    : selectedYear === "2025"
                      ? "Electrical and Electronics, Mechanical, and Civil Engineering"
                      : "Computer Science, Electronics & Communication, and Mechanical Engineering",
                  icon: <Aperture className="h-8 w-8 text-primary" />,
                },
                {
                  title: "Approval",
                  description: "Approved by AICTE and Affiliated to KTU",
                  icon: <Building className="h-8 w-8 text-primary" />,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="group"
                >
                  <Card className="h-full border border-border/80 hover:border-primary/30 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.06)] bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex flex-col justify-start">
                    <CardHeader className="pb-4">
                      <div className="mb-4 p-2.5 w-fit rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors duration-300">
                        <div className="group-hover:scale-105 transition-transform duration-300">
                          {item.icon}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-3">
            Next Steps for Your Engineering Journey
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Selected candidates should complete the admission formalities to secure their seat in CET's prestigious program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/apply">
              <Button size="lg" className="shadow-md">
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">Contact Us</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

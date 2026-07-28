import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  GraduationCap,
  Users,
  Bell,
  Zap,
  Thermometer,
  TrafficCone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const AnimatedCard = ({ children, delay = 0 }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeIn}
    transition={{ delay }}
    whileHover={{ y: -6, scale: 1.01 }}
    className="h-full"
  >
    {children}
  </motion.div>
);

const SectionWrapper = ({ children, id, className = "" }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [controls, inView]);

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
      id={id}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </motion.section>
  );
};

export default function Home() {
  const heroControls = useAnimation();
  const [heroRef, heroInView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    if (heroInView) {
      heroControls.start({ opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } });
    }
  }, [heroControls, heroInView]);

  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setNoticesLoading(true);
        const snapshot = await getDocs(collection(db, "notices"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotices(data);
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setNoticesLoading(false);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-background pt-14 pb-12 sm:py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 items-center">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 40 }}
              animate={heroControls}
              className="space-y-5 sm:space-y-8 order-2 lg:order-1"
            >
              <div className="space-y-2.5 sm:space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Admissions Open for 2026-27
                </motion.div>

                <motion.h1
                  className="tracking-tight text-balance leading-none flex flex-col gap-2 sm:gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground whitespace-nowrap">
                    BTech & MTech
                  </span>
                  <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-muted-foreground/90 tracking-tight whitespace-nowrap">
                    Working Professionals Programs
                  </span>
                  <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-primary via-violet-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                    College of Engineering Trivandrum
                  </span>
                </motion.h1>

                <motion.p
                  className="text-sm sm:text-lg md:text-xl text-muted-foreground text-pretty max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                >
                  Advance your engineering career with our industry-aligned evening program designed for working professionals.
                </motion.p>
              </div>

              <motion.div
                className="flex flex-row gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <Link to="/apply" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full shadow-md hover:shadow-lg text-sm sm:text-base px-4 sm:px-6">
                    Apply Now
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>

                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 sm:flex-none text-sm sm:text-base px-4 sm:px-6 cursor-pointer"
                  onClick={() => {
                    document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Details
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative h-[180px] sm:h-[260px] md:h-[350px] lg:h-[450px] rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ scale: 1.02 }}
            >
              <img
                src="/cet0.jpg?height=450&width=600"
                alt="CET Campus"
                className="object-cover w-full h-full transition-all duration-700 hover:scale-105"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Notices Section */}
      <SectionWrapper className="bg-muted/30">
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-14" variants={fadeIn}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Bell className="h-4 w-4" />
                Latest Updates
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Notices & Announcements</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Stay informed with important updates regarding admissions, allotments, and schedules.
              </p>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto grid gap-5 sm:grid-cols-1 md:grid-cols-2"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              {noticesLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="col-span-1">
                      <SkeletonCard />
                    </div>
                  ))}
                </>
              ) : notices.length === 0 ? (
                <p className="text-center text-muted-foreground col-span-full py-12">
                  No notices at the moment. Check back later.
                </p>
              ) : (
                notices
                  .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                  .slice(0, 6)
                  .map((notice, index) => (
                    <motion.div
                      key={notice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                      whileHover={notice.link ? { y: -4, transition: { duration: 0.2 } } : {}}
                      className={`group ${notice.link ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => {
                        if (notice.link) {
                          window.open(notice.link, "_blank", "noopener,noreferrer");
                        }
                      }}
                    >
                      <Card
                        className={`h-full transition-all duration-300 ${
                          notice.link ? "card-hover" : ""
                        } ${notice.important ? "border-red-200/70 bg-red-50/30" : ""}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <time
                              className="text-xs font-medium text-primary"
                              dateTime={new Date(notice.createdAt?.seconds * 1000).toISOString()}
                            >
                              {new Date(notice.createdAt?.seconds * 1000).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </time>
                            {notice.important && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                Important
                              </span>
                            )}
                          </div>
                          <CardTitle className={`text-base font-semibold leading-snug transition-colors flex items-center justify-between gap-2 ${
                            notice.link ? "group-hover:text-primary" : ""
                          }`}>
                            <span>{notice.title}</span>
                            {notice.link && (
                              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {notice.message}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </motion.div>
          </div>
        </div>
      </SectionWrapper>

      {/* Programs Section */}
      <SectionWrapper id="programs">
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-14" variants={fadeIn}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Our BTech Programs</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Industry-aligned engineering programs designed for working professionals seeking career advancement.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Computer Science and Engineering",
                  description:
                    "Covers software engineering, data structures, algorithms, databases, computer networks, and artificial intelligence.",
                  icon: <BookOpen className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Electronics and Communication Engineering",
                  description:
                    "Focuses on semiconductor devices, analog and digital circuits, signals and systems, communication engineering, and VLSI design.",
                  icon: <GraduationCap className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Mechanical Engineering",
                  description:
                    "Explores thermodynamics, fluid mechanics, manufacturing processes, machine design, CAD/CAM, and automotive systems.",
                  icon: <Users className="h-10 w-10 text-primary" />,
                },
              ].map((program, index) => (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="h-full transition-all duration-300 card-hover group">
                    <CardHeader>
                      <div className="mb-4 p-3 w-fit rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                          {program.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{program.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to="/apply">
                        <Button
                          variant="outline"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                        >
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* M.Tech Programs Section */}
      <SectionWrapper id="mtech-programs">
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-14" variants={fadeIn}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-sm font-medium mb-4">
                <GraduationCap className="h-4 w-4" />
                Postgraduate
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">M.Tech for Working Professionals</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Advanced postgraduate specializations in high-demand engineering areas for employed graduates.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Control Systems",
                  branch: "Electrical Engineering",
                  description:
                    "Advanced study of control theory, robotics, EV design, smart power grids, and industrial automation systems.",
                  seats: "15 Seats",
                  icon: <Zap className="h-10 w-10 text-violet-600 dark:text-violet-400" />,
                },
                {
                  title: "Thermal Science",
                  branch: "Mechanical Engineering",
                  description:
                    "In-depth exploration of renewable energy systems, aerospace propulsion, heat transfer, and advanced thermodynamics.",
                  seats: "15 Seats",
                  icon: <Thermometer className="h-10 w-10 text-violet-600 dark:text-violet-400" />,
                },
                {
                  title: "Traffic & Transportation Engineering",
                  branch: "Civil Engineering",
                  description:
                    "Specialization in logistics, smart city infrastructure, transportation planning, and sustainable mobility systems.",
                  seats: "15 Seats",
                  icon: <TrafficCone className="h-10 w-10 text-violet-600 dark:text-violet-400" />,
                },
              ].map((program, index) => (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="h-full transition-all duration-300 card-hover group border-violet-200/50 dark:border-violet-800/30">
                    <CardHeader>
                      <div className="mb-4 p-3 w-fit rounded-xl bg-violet-500/5 group-hover:bg-violet-500/10 transition-colors duration-300">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                          {program.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{program.title}</CardTitle>
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                        {program.branch}
                      </p>
                      <CardDescription className="text-sm leading-relaxed">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                          {program.seats}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                          2 Years
                        </span>
                      </div>
                      <Link to="/apply">
                        <Button
                          variant="outline"
                          className="w-full border-violet-300 text-violet-700 hover:bg-violet-600 hover:text-white hover:border-violet-600 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white dark:hover:border-violet-600 transition-all duration-300"
                        >
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Fee Structure */}
      <SectionWrapper className="bg-muted/30">
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-14" variants={fadeIn}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Fee Structure</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transparent and affordable fee structure for the Working Professionals programs.
              </p>
            </motion.div>

            <motion.div
              className="max-w-2xl mx-auto"
              variants={fadeIn}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {[
                    { label: "Admission Fee", value: "Rs. 1,500/-", note: "one-time" },
                    { label: "Tuition Fee", value: "Rs. 31,000/-", note: "per semester" },
                    { label: "Special Fee", value: "Rs. 3,150/-", note: "per year" },
                    { label: "Caution Deposit", value: "Rs. 2,500/-", note: "refundable" },
                    { label: "Pre-Matriculation & Registration Fee", value: "Rs. 4,955/-", note: "" },
                    { label: "PTA Fees", value: "Rs. 10,000/-", note: "" },
                    { label: "Bus Fee", value: "Rs. 2,000/-", note: "" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className="text-sm text-right">
                        <span className="font-semibold text-foreground">{item.value}</span>
                        {item.note && (
                          <span className="text-xs text-muted-foreground ml-1">({item.note})</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Government and University fee payment is accepted only through{" "}
                    <strong>Bank Transfer, UPI, or Online payment methods</strong>. Card and cash payments are not accepted.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>

      {/* Admission Process */}
      <SectionWrapper>
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-14" variants={fadeIn}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Admission Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A streamlined process designed to make your admission journey smooth and transparent.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  title: "1. Application",
                  description:
                    "Submit your online application with all required documents and preferences.",
                  icon: <Calendar className="h-10 w-10 text-primary" />,
                },
                {
                  title: "2. Allotment",
                  description:
                    "Applications are reviewed based on LET rank, reservation policy, and candidate preferences.",
                  icon: <CheckCircle className="h-10 w-10 text-primary" />,
                },
                {
                  title: "3. Document Verification",
                  description: (
                    <>
                      <p>
                        Candidates must appear physically at CET with all original documents. Admission is confirmed
                        only on payment of full fees via digipay (no cash).
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        <Link
                          to="https://drive.google.com/file/d/1KNvGF_31V_tL_hl0X3VbDy1QnPttbAju/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm underline-offset-2 hover:underline"
                        >
                          Documents required →
                        </Link>
                        <Link
                          to="https://drive.google.com/file/d/1WLgFCCfhTuiGxBcKL0uLFjzzd1K3CrUz/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm underline-offset-2 hover:underline"
                        >
                          Instructions →
                        </Link>
                        <Link
                          to="https://drive.google.com/file/d/1kjssf1NXXGXr_anfc3GCVH2eKols7H1p/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm underline-offset-2 hover:underline font-medium"
                        >
                          ഭരണഭാഷ-മാഭാഷ (G.O) →
                        </Link>
                      </div>
                    </>
                  ),
                  icon: <Users className="h-10 w-10 text-primary" />,
                },
                {
                  title: "4. Commencement of Classes",
                  description:
                    "Admitted candidates begin classes from July 1st. Classes held 5:45 PM - 9:15 PM on weekdays.",
                  icon: <GraduationCap className="h-10 w-10 text-primary" />,
                },
              ].map((step, index) => (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <Card className="transition-all duration-300 card-hover group h-full">
                    <CardHeader>
                      <div className="mb-4 p-3 w-fit rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <div className="group-hover:-translate-y-1 transition-transform duration-300">
                          {step.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground/80 transition-colors">
                        {step.description}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>

            <motion.div
              className="text-center mt-12"
              variants={fadeIn}
              transition={{ delay: 0.4 }}
            >
              <Link to="/admission">
                <Button className="shadow-md hover:shadow-lg">
                  Learn More About Admissions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>

      {/* CTA Section */}
      <SectionWrapper>
        <div className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-10 md:p-16 text-center"
              variants={fadeIn}
            >
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-3xl" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Begin Your Engineering Journey?
                </h2>
                <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
                  Join CET's prestigious Working Professionals programs — B.Tech or M.Tech — and take your engineering career to the next level.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/apply">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full sm:w-auto shadow-md hover:shadow-lg"
                    >
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white hover:text-primary hover:border-white transition-all duration-300"
                    >
                      Contact Us
                    </Button>
                  </Link>
                  {/* <Link to="https://drive.google.com/file/d/1N9gARnxlDe95UEgKyLyoqndtDi17Qcy1/view?usp=sharing">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto bg-transparent border-white/40 text-white hover:bg-white hover:text-primary hover:border-white transition-all duration-300"
                    >
                      Press Release
                    </Button>
                  </Link> */}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}

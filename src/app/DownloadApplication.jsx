import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, AlertCircle, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { generateBtechPDF } from "./utils/generateBtechPDF";
import { generateMtechPDF } from "./utils/generateMtechPDF";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";

export default function DownloadApplication() {
  const [degreeType, setDegreeType] = useState("mtech");
  const [year, setYear] = useState("2026");
  const [letRollNo, setLetRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [applicationData, setApplicationData] = useState(null);

  const handleDegreeChange = (val) => {
    setDegreeType(val);
    setErrorMsg("");
    setApplicationData(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (degreeType === "btech") {
      if (!letRollNo || !email || !phone) {
        setErrorMsg("Please fill in all search fields.");
        setApplicationData(null);
        return;
      }
    } else {
      if (!email || !phone) {
        setErrorMsg("Please fill in Registered Email and Mobile Number.");
        setApplicationData(null);
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");
    setApplicationData(null);

    try {
      const normalizeString = (str) => String(str || "").trim().toLowerCase();
      const cleanPhone = (str) => String(str || "").replace(/\D/g, "").slice(-10);

      const normalizedEmail = normalizeString(email);
      const normalizedPhone = normalizeString(phone);
      const targetPhoneDigits = cleanPhone(phone);

      if (degreeType === "btech") {
        const normalizedLet = normalizeString(letRollNo);
        const regDocId = `btech_${year}_reg_${normalizedLet}_${normalizedEmail}_${normalizedPhone}`;
        const spotDocId = `btech_${year}_spot_${normalizedLet}_${normalizedEmail}_${normalizedPhone}`;

        const regDocRef = doc(db, "applications", regDocId);
        const spotDocRef = doc(db, "applications", spotDocId);

        const [regSnap, spotSnap] = await Promise.all([
          getDoc(regDocRef),
          getDoc(spotDocRef)
        ]);

        let found = null;
        if (spotSnap.exists()) {
          found = { id: spotSnap.id, ...spotSnap.data() };
        } else if (regSnap.exists()) {
          found = { id: regSnap.id, ...regSnap.data() };
        }

        // Fallback search across applications collection if key mismatch
        if (!found) {
          const btechSnap = await getDocs(collection(db, "applications"));
          btechSnap.forEach((docSnap) => {
            if (found) return;
            const data = docSnap.data();
            const dbEmail = normalizeString(data.email);
            const dbPhoneDigits = cleanPhone(data.phone);
            const dbLet = normalizeString(data.letRegNo || data.letRollNo);
            
            if (
              dbEmail === normalizedEmail &&
              (dbPhoneDigits === targetPhoneDigits || normalizeString(data.phone) === normalizedPhone) &&
              (dbLet === normalizedLet || normalizedLet === "0")
            ) {
              found = { id: docSnap.id, ...data };
            }
          });
        }

        if (found) {
          setApplicationData(found);
        } else {
          setErrorMsg("No application found matching the provided details. Please verify your Academic Year, LET Roll Number, Email, and Phone Number.");
        }
      } else {
        // Search M.Tech applications in mtech_applications collection
        const qSnap = await getDocs(collection(db, "mtech_applications"));
        let found = null;
        
        qSnap.forEach((docSnap) => {
          if (found) return;
          const data = docSnap.data();
          const dbEmail = normalizeString(data.email);
          const dbPhoneDigits = cleanPhone(data.phone);

          if (
            dbEmail === normalizedEmail &&
            (dbPhoneDigits === targetPhoneDigits || normalizeString(data.phone) === normalizedPhone)
          ) {
            found = { id: docSnap.id, ...data };
          }
        });

        if (found) {
          setApplicationData(found);
        } else {
          setErrorMsg("No M.Tech application found matching the provided Email and Phone Number. Please verify your details.");
        }
      }
    } catch (err) {
      console.error("Error retrieving application:", err);
      setErrorMsg("Failed to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link 
          to="/apply" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Apply
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold tracking-tight">Retrieve Application Form</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Search and download your submitted {degreeType === "mtech" ? "M.Tech" : "B.Tech"} (Working Professionals) application form.
          </p>
        </motion.div>

        {/* Program Selection Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs value={degreeType} onValueChange={handleDegreeChange} className="w-full max-w-md">
            <TabsList className="bg-muted/50 p-1 rounded-xl w-full grid grid-cols-2">
              <TabsTrigger
                value="btech"
                className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
              >
                B.Tech (WP)
              </TabsTrigger>
              <TabsTrigger
                value="mtech"
                className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-800"
              >
                M.Tech (WP)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6 md:p-8">
          <form onSubmit={handleSearch} className="space-y-5">
            <div className={`grid grid-cols-1 ${degreeType === "btech" ? "md:grid-cols-2" : ""} gap-5`}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="2026">2026-27</option>
                  <option value="2025">2025-26</option>
                </select>
              </div>

              {degreeType === "btech" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    LET Roll / Reg Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Roll Number (or '0' if N/A)"
                    value={letRollNo}
                    onChange={(e) => setLetRollNo(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Registered Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching Database...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Fetch & Get Application
                </>
              )}
            </Button>
          </form>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex gap-3 items-start"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{errorMsg}</div>
            </motion.div>
          )}

          {applicationData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 border border-border p-6 rounded-2xl bg-muted/20"
            >
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{applicationData.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Application ID: {applicationData.id}
                  </p>
                </div>
                {degreeType === "btech" && applicationData.isSpot ? (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Spot Round
                  </span>
                ) : (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {degreeType === "mtech" ? "M.Tech" : "B.Tech"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-3 text-sm mb-6">
                {degreeType === "btech" ? (
                  <>
                    <div>
                      <span className="text-muted-foreground text-xs block">Highest Education</span>
                      <span className="font-medium">{applicationData.highestEducation || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">LET Roll No</span>
                      <span className="font-medium">{applicationData.letRegNo || "N/A"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-muted-foreground text-xs block">B.Tech Degree</span>
                      <span className="font-medium">{applicationData.btechDegree || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block">Specialization</span>
                      <span className="font-medium">{applicationData.specialization || "N/A"}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground text-xs block">Email Address</span>
                  <span className="font-medium truncate block max-w-[200px]">{applicationData.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs block">Phone Number</span>
                  <span className="font-medium">{applicationData.phone}</span>
                </div>
              </div>

              <Button
                onClick={() =>
                  degreeType === "mtech"
                    ? generateMtechPDF(applicationData)
                    : generateBtechPDF(applicationData)
                }
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
              >
                <Download className="w-4 h-4" />
                Download Application PDF
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

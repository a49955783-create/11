import { useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import "./index.css";

function App() {
  const [text, setText] = useState("");
  const [units, setUnits] = useState([]);
  const [receiver, setReceiver] = useState("");
  const [deputy, setDeputy] = useState("");
  const [errors, setErrors] = useState({});
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // تطبيق الوضع الداكن/الفاتح
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  // رفع صورة
  const handleImage = async (file) => {
    if (!file) return;
    const { data } = await Tesseract.recognize(file, "ara");
    const cleaned = data.text
      .split("\n")
      .map((line) => line.replace(/[^\u0600-\u06FF0-9\s\-]/g, "").trim())
      .filter((l) => l.length > 0);
    setUnits(cleaned.map((u, i) => ({ id: i, name: u, code: "", status: "في الميدان" })));
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handleImage(file);
      }
    }
  };

  // توليد التقرير
  const generateReport = () => {
    const errs = {};
    if (!receiver.trim()) errs.receiver = "حقل المستلم مطلوب";
    if (!deputy.trim()) errs.deputy = "حقل النائب مطلوب";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const inField = units.filter((u) => u.status !== "خارج الخدمة");
    const outField = units.filter((u) => u.status === "خارج الخدمة");

    let report = `📌 استلام العمليات 📌

المستلم : ${receiver}
النائب  : ${deputy}

عدد و اسماء الوحدات الاسعافيه في الميدان : (${inField.length + 1})
${inField.map((u) => `- ${u.name} | ${u.code} ${u.status === "مشغول" ? "(مشغول)" : ""}`).join("\n")}

خارج الخدمة : (${outField.length})

🎙️ تم استلام العمليات و جاهزون للتعامل مع البلاغات
الملاحظات : تحديث`;

    setText(report);
  };

  const copyReport = () => {
    navigator.clipboard.writeText(text);
    alert("تم نسخ التقرير ✅");
  };

  return (
    <div className="app" onPaste={handlePaste}>
      {/* الشعاران + العنوان */}
      <header className="header">
        <img src="/logo-left.png" alt="logo left" className="logo"/>
        <h1>تحديث مركز العمليات للصحة</h1>
        <img src="/logo-right.png" alt="logo right" className="logo"/>
      </header>

      {/* الحقول */}
      <div className="form">
        <div>
          <label>المستلم</label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className={errors.receiver ? "error" : ""}
            placeholder="أدخل اسم المستلم"
          />
          {errors.receiver && <p className="err">{errors.receiver}</p>}
        </div>
        <div>
          <label>النائب</label>
          <input
            type="text"
            value={deputy}
            onChange={(e) => setDeputy(e.target.value)}
            className={errors.deputy ? "error" : ""}
            placeholder="أدخل اسم النائب"
          />
          {errors.deputy && <p className="err">{errors.deputy}</p>}
        </div>
      </div>

      {/* الوحدات */}
      <div className="units">
        {units.map((u, i) => (
          <div key={i} className="unit">
            <input
              value={u.name}
              onChange={(e) => {
                const copy = [...units];
                copy[i].name = e.target.value;
                setUnits(copy);
              }}
            />
            <input
              value={u.code}
              placeholder="كود"
              onChange={(e) => {
                const copy = [...units];
                copy[i].code = e.target.value;
                setUnits(copy);
              }}
            />
            <select
              value={u.status}
              onChange={(e) => {
                const copy = [...units];
                copy[i].status = e.target.value;
                setUnits(copy);
              }}
            >
              <option>في الميدان</option>
              <option>مشغول</option>
              <option>خارج الخدمة</option>
            </select>
          </div>
        ))}
      </div>

      {/* الأزرار */}
      <div className="actions">
        <button className="violet" onClick={generateReport}>توليد النص النهائي</button>
        <button className="violet" onClick={copyReport}>نسخ النتيجة</button>
        <button onClick={() => setDark(!dark)}>
          {dark ? "الوضع الفاتح" : "الوضع الداكن"}
        </button>
      </div>

      {/* النص النهائي */}
      {text && <pre className="report">{text}</pre>}
    </div>
  );
}

export default App;

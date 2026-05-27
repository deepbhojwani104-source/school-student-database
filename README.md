# 🎓 EduBase — School Student Database

A beautiful, fully offline **School Student Database** web application where students can enter their data and it gets saved to an **Excel file** (.xlsx). Built with pure HTML, CSS, and JavaScript — no backend required!

![EduBase Preview](./preview.png)

---

## ✨ Features

- 📝 **Student Registration Form** — 14 fields including Name, Roll No, Class, Section, DOB, Gender, Parents' Names, Phone, Email, Blood Group, Address, and Admission Date
- ✅ **Form Validation** — Required field checks, duplicate roll number detection, phone & email format validation
- 🔍 **Live Search & Filter** — Search by name/roll/class and filter by Class or Gender
- 📊 **Export to Excel** — One-click `.xlsx` download powered by [SheetJS](https://sheetjs.com/)
- 💾 **Auto-Save** — Data persists in browser `localStorage` across page refreshes
- 🗑️ **Delete with Confirmation** — Safe deletion with a confirmation modal
- 🎨 **Premium Dark UI** — Glassmorphism design with animated background orbs, smooth transitions, and responsive layout

---

## 🚀 Getting Started

No installation needed! This is a pure frontend app.

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/school-student-database.git
   cd school-student-database
   ```

2. **Open in browser**
   - Simply double-click `index.html`, OR
   - Right-click → Open with → Your browser

3. **Start adding students!**

---

## 📁 Project Structure

```
school-student-database/
├── index.html      # App structure & UI
├── style.css       # Dark glassmorphism design
├── app.js          # All logic (form, validation, Excel export)
└── README.md       # This file
```

---

## 📊 How Excel Export Works

The app uses the **SheetJS (xlsx)** library (loaded via CDN) to generate a proper `.xlsx` file with:
- All 15 columns of student data
- Auto-sized column widths
- Filename format: `School_Student_Database_YYYY-MM-DD.xlsx`

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 | Structure & Semantics |
| Vanilla CSS | Glassmorphism styling, animations |
| Vanilla JavaScript | App logic, validation, filtering |
| [SheetJS (xlsx)](https://sheetjs.com/) | Excel file generation |
| Google Fonts (Outfit) | Typography |
| localStorage | Data persistence |

---

## 📸 Screenshots

> Open `index.html` in your browser to see the live app.

---

## 📄 License

MIT License — free to use and modify.

---

Made with ❤️ using pure HTML, CSS & JavaScript

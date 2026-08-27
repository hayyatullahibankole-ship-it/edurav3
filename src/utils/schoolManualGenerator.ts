import jsPDF from "jspdf";

export const generateSchoolManual = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const secondaryColor: [number, number, number] = [16, 185, 129]; // Green

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  // Helper function to add section
  const addSection = (title: string, content: string) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    addText(title, 14, true);
    addText(content, 11, false);
    yPosition += 5;
  };

  // Cover Page with Edura Branding
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 90, "F");
  
  // Edura Logo Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("EDURA", pageWidth / 2, 30, { align: "center" });
  
  doc.setFontSize(22);
  doc.text("School Dashboard", pageWidth / 2, 45, { align: "center" });
  
  doc.setFontSize(14);
  doc.text("Complete User Manual", pageWidth / 2, 58, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("WAEC • JAMB • NECO CBT Practice Platform", pageWidth / 2, 72, { align: "center" });
  doc.text("www.edura.com.ng", pageWidth / 2, 82, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  yPosition = 105;

  addText("Welcome to Edura School Dashboard!", 14, true);
  addText("This comprehensive manual will guide you through every feature of your school's CBT practice platform. Edura provides complete exam preparation tools for WAEC, JAMB, and NECO with 10,000+ authentic questions, real-time analytics, and comprehensive student management.", 11);
  yPosition += 10;

  // Table of Contents
  addText("Table of Contents", 16, true);
  const tocItems = [
    "1. Getting Started",
    "2. Dashboard Overview",
    "3. Managing Students",
    "4. Viewing Reports",
    "5. Monitoring Performance",
    "6. Billing & Subscriptions",
    "7. Account Settings",
    "8. Support & Contact"
  ];
  tocItems.forEach(item => addText(item, 11));
  yPosition += 10;

  // Page 2 - Getting Started
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "1. Getting Started with Edura",
    "After logging in to your Edura school dashboard at www.edura.com.ng/school-login, you'll land on the Overview page. This is your mission control center for monitoring all student activities, performance metrics, and practice sessions."
  );

  addSection(
    "What Makes Edura Special:",
    "• 10,000+ Authentic WAEC, JAMB & NECO Questions\n• Real-time Student Performance Tracking\n• Automated Score Analytics & Weak Area Detection\n• Bulk Student Management with Excel Upload\n• Comprehensive PDF/Excel Reports\n• Secure Payment System\n• 24/7 WhatsApp Support"
  );

  addSection(
    "First Login Checklist:",
    "✓ Save your school code (displayed prominently on dashboard)\n✓ Share school code with students for easy registration\n✓ Complete school profile information\n✓ Activate your subscription\n✓ Add your first batch of students\n✓ Download this manual for offline reference"
  );

  // Page 3 - Dashboard Overview
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "2. Understanding Your Edura Dashboard",
    "The Overview page is designed to give you instant insights into your school's exam preparation progress at a glance."
  );

  addSection(
    "Key Metrics Displayed:",
    "📊 Total Students: Shows your current student count vs. subscription limit\n📈 Active This Week: Number of students who practiced in the last 7 days\n🎯 Average Score: School-wide performance average across all practice tests\n🏆 Top Performers: Leaderboard of students excelling in practice\n📝 School Code: Unique code for student registration (e.g., SCH12345)"
  );

  addSection(
    "Quick Actions Panel (4 Essential Buttons):",
    "1. Add Student: Register new students individually\n2. User Manual: Download this PDF guide anytime\n3. View Students: Access complete student list\n4. View Reports: Generate performance analytics"
  );

  addSection(
    "Navigation Sidebar (Left Menu):",
    "• Overview: Dashboard home with key metrics\n• Students: Complete student management tools\n• Reports: Detailed analytics and exports\n• Billing: Subscription and payment history\n• Settings: School profile and password management"
  );

  addSection(
    "Real-Time Activity Feed:",
    "Located at the bottom of your dashboard, this shows:\n• Students currently taking practice tests\n• Recently completed exams\n• New student registrations\n• Achievement milestones reached"
  );

  // Page 4 - Managing Students
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "3. Managing Students in Edura",
    "Click 'Students' in the left sidebar to access complete student management tools. This is where you add, edit, monitor, and manage all student accounts."
  );

  addSection(
    "Method 1: Adding Students Individually",
    "Perfect for adding a few students at a time:\n\n1. Click the 'Add Student' button (top right)\n2. Fill in the registration form:\n   • Full Name (required)\n   • Email Address (optional but recommended)\n   • Class/Grade (e.g., SS3, JSS2)\n   • Phone Number (optional)\n3. Click 'Create Student'\n4. System generates unique login credentials\n5. Credentials are displayed on screen - copy and share with student\n6. If email provided, student receives credentials automatically"
  );

  addSection(
    "Method 2: Bulk Upload (Excel)",
    "Add 10-250 students in minutes:\n\n1. Click 'Bulk Upload' button\n2. Download the Excel template file\n3. Fill in student details in the spreadsheet:\n   • Column A: Full Name\n   • Column B: Email (optional)\n   • Column C: Class\n   • Column D: Phone Number (optional)\n4. Save the Excel file\n5. Click 'Upload File' and select your spreadsheet\n6. Edura processes the file and creates all accounts\n7. Download the generated credentials sheet\n8. Print and distribute credentials to students"
  );

  addSection(
    "Student Management Features:",
    "✓ Search: Find students quickly by name or class\n✓ Filter: View students by class, performance, or activity\n✓ View Details: Click any student to see:\n  - Practice test history\n  - Subject-wise performance\n  - Weak topics identified\n  - Time spent practicing\n  - Last active date\n✓ Edit: Update student information\n✓ Reset Password: Generate new login credentials\n✓ Deactivate: Temporarily suspend student access\n✓ Delete: Remove student account (caution: irreversible)\n✓ Export: Download student list as Excel or PDF"
  );

  // Page 5 - Reports
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "4. Comprehensive Reports & Analytics",
    "Click 'Reports' in the sidebar to access Edura's powerful analytics engine. All reports can be exported as PDF or Excel."
  );

  addSection(
    "Available Report Types:",
    "📋 Individual Student Reports:\n• Complete practice history\n• Subject-by-subject breakdown\n• Score progression over time\n• Time spent per subject\n• Weak topics identification\n• Recommended focus areas\n\n📊 Class/Group Reports:\n• Class average scores\n• Top 10 performers in class\n• Students needing attention\n• Subject mastery levels\n• Practice frequency analysis\n\n🎯 Subject Analysis Reports:\n• Performance per subject (Math, English, etc.)\n• Topic-level breakdown\n• Correct vs incorrect attempts\n• Common error patterns\n• Question difficulty analysis\n\n📈 Trend Reports:\n• Weekly/Monthly progress tracking\n• Score improvement trends\n• Practice consistency metrics\n• Exam readiness indicators"
  );

  addSection(
    "How to Generate & Export Reports:",
    "1. Navigate to 'Reports' tab from sidebar\n2. Select report type from dropdown menu\n3. Choose date range (Last 7 days, 30 days, or Custom)\n4. Apply filters (Class, Subject, Student)\n5. Preview report on screen\n6. Click 'Export as PDF' or 'Export as Excel'\n7. Report downloads automatically to your device\n8. Share reports with teachers or parents\n\nPro Tip: Generate monthly reports for parent-teacher meetings!"
  );

  // Page 6 - Performance Monitoring
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "5. Performance Monitoring Tools",
    "Edura provides multiple ways to track and analyze student exam preparation progress in real-time."
  );

  addSection(
    "Performance Overview Charts:",
    "Located on your Overview dashboard:\n\n📊 Score Distribution Chart:\nShows how students are performing across different score ranges:\n• 0-40%: Needs urgent intervention\n• 41-60%: Developing understanding\n• 61-80%: Good performance\n• 81-100%: Excellent performance\n\n📈 Weekly Practice Trends:\nDisplays daily practice activity for the past 7 days\n• Identifies peak practice days\n• Shows practice consistency\n• Highlights inactive periods\n\n🎯 Subject Performance Breakdown:\nCompares average scores across subjects:\n• Mathematics, English, Physics, Chemistry, Biology\n• Economics, Literature, Government, etc.\n• Identifies strongest and weakest subjects"
  );

  addSection(
    "Student Engagement Metrics:",
    "Track how actively students are using Edura:\n\n✓ Daily Active Students: Students practicing today\n✓ Weekly Active Rate: % of students practicing this week\n✓ Average Practice Time: Time spent per student\n✓ Questions Attempted: Total practice questions answered\n✓ Test Completion Rate: % of started tests completed\n✓ Login Frequency: How often students access platform"
  );

  addSection(
    "Identifying At-Risk Students:",
    "Edura automatically flags students who need attention:\n\n⚠️ Red Flags:\n• No practice activity in 7+ days\n• Average score below 40%\n• Multiple incomplete tests\n• Declining score trends\n\n💡 Recommended Actions:\n• Contact student/parent\n• Assign additional practice\n• Schedule remedial sessions\n• Monitor progress closely"
  );

  // Page 7 - Billing
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "6. Billing & Subscriptions",
    "Click 'Billing' in the sidebar to manage your Edura subscription and view payment history."
  );

  addSection(
    "Edura Subscription Plans:",
    "All plans include 3-month access with full features:\n\n💰 Pricing by Student Count:\n• 1-50 students: ₦1,000 per student\n• 51-100 students: ₦900 per student\n• 101-200 students: ₦850 per student\n• 201-250 students: ₦800 per student\n• 250+ students: Contact support for enterprise pricing\n\n✅ All Plans Include:\n• 10,000+ WAEC, JAMB & NECO questions\n• Unlimited practice tests\n• Real-time analytics dashboard\n• PDF/Excel report exports\n• Bulk student management\n• Priority WhatsApp support\n• Regular question updates"
  );

  addSection(
    "How to Subscribe/Renew:",
    "1. Click 'Billing' in sidebar\n2. View your current plan status\n3. Click 'Upgrade Plan' or 'Renew Subscription'\n4. Enter number of students\n5. System calculates total cost\n6. Click 'Proceed to Payment'\n7. Pay securely via:\n   • Bank Card (Visa/Mastercard)\n   • Bank Transfer\n   • USSD\n8. Payment confirmed instantly\n9. Subscription activates immediately\n10. Receipt sent to your email"
  );

  addSection(
    "Payment History & Receipts:",
    "View all your transactions:\n• Date: When payment was made\n• Reference: Transaction ID for support queries\n• Amount: Total paid\n• Status: Success/Pending/Failed\n• Download: Get receipt PDF\n\nKeep receipts for accounting records!"
  );

  addSection(
    "Subscription Expiry & Renewal:",
    "⏰ Important Reminders:\n• Edura sends email reminders 7 days before expiry\n• Students can't practice after subscription expires\n• Renew early to avoid disruption\n• Your data is preserved for 30 days after expiry\n• Reactivation restores all student data"
  );

  // Page 8 - Settings & Support
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "7. Account Settings & Security",
    "Click 'Settings' in the sidebar to manage school profile and account security."
  );

  addSection(
    "Updating School Information:",
    "Keep your profile current (affects receipts and communication):\n\n1. Navigate to Settings tab\n2. Update any of these fields:\n   • School Name (official name)\n   • Contact Email (for notifications)\n   • Phone Number (for support)\n   • Physical Address (complete address)\n   • State/Region\n3. Click 'Update School Information'\n4. Changes saved instantly\n\nWhy keep info updated?\n✓ Accurate payment receipts\n✓ Receive important notifications\n✓ Enable support to reach you\n✓ Proper documentation for records"
  );

  addSection(
    "Password Management:",
    "Change your password regularly for security:\n\n1. Go to Settings tab\n2. Scroll to 'Change Password' section\n3. Enter new password (min 8 characters)\n4. Confirm new password\n5. Click 'Change Password'\n6. You'll be logged out automatically\n7. Login again with new password\n\n🔒 Password Tips:\n• Use at least 8 characters\n• Mix uppercase and lowercase\n• Include numbers and symbols\n• Don't share with anyone\n• Change every 3 months"
  );

  addSection(
    "8. Getting Help & Support",
    "Edura Support is available 24/7 to assist you!"
  );

  addSection(
    "Contact Channels:",
    "📱 WhatsApp Support (Fastest):\n+234 705 075 7085\nResponse time: Usually within 5 minutes\nBest for: Urgent issues, quick questions\n\n📧 Email Support:\nsupport@edura.com.ng\nResponse time: Within 24 hours\nBest for: Detailed queries, documentation requests\n\n💬 In-Dashboard Chat:\nClick the help icon (bottom right)\nResponse time: Instant during business hours\nBest for: Technical issues while using platform\n\n🌐 Website:\nwww.edura.com.ng\nFind: Documentation, FAQs, Video tutorials"
  );

  addSection(
    "Common Issues & Quick Solutions:",
    "❓ Forgot Password:\n→ Click 'Forgot Password' on login page\n→ Enter registered email\n→ Check email for reset link\n\n❓ Student Can't Login:\n→ Verify credentials in Student list\n→ Check if subscription is active\n→ Try resetting student password\n\n❓ Payment Not Reflecting:\n→ Wait 5 minutes for confirmation\n→ Check spam folder for receipt\n→ Contact support with transaction reference\n\n❓ Can't Add More Students:\n→ Check if you've reached student limit\n→ Upgrade subscription to add more\n\n❓ Reports Not Generating:\n→ Check internet connection\n→ Try different browser\n→ Clear browser cache\n→ Contact support if persists"
  );

  addSection(
    "When Contacting Support:",
    "Always provide:\n✓ Your school name\n✓ School code\n✓ Description of the issue\n✓ Screenshots (if applicable)\n✓ Transaction reference (for payment issues)\n\nThis helps us resolve your issue faster!"
  );

  // Page 9 - Tips & Best Practices
  doc.addPage();
  yPosition = margin;
  
  addSection(
    "9. Best Practices & Success Tips",
    "Maximize Edura's impact on your students' exam preparation with these proven strategies."
  );

  addSection(
    "Weekly Success Routine:",
    "📅 Monday:\n• Review weekend practice statistics\n• Identify inactive students\n• Send motivational messages\n\n📅 Tuesday-Thursday:\n• Monitor daily activity dashboard\n• Respond to student queries\n• Check real-time activity feed\n\n📅 Friday:\n• Generate weekly performance reports\n• Export top performers list\n• Identify struggling students\n• Plan weekend practice goals\n\n📅 End of Month:\n• Generate comprehensive monthly reports\n• Compare class performance trends\n• Schedule parent meetings if needed\n• Review subscription status"
  );

  addSection(
    "Proven Strategies for Better Results:",
    "✅ Set Daily Practice Goals:\n• Encourage 30 minutes daily practice\n• Recommend 5-10 questions per subject\n• Track consistency, not just scores\n\n✅ Use Data to Guide Teaching:\n• Review subject performance reports\n• Identify common weak topics\n• Focus classroom teaching on these areas\n• Assign targeted practice to students\n\n✅ Motivate with Recognition:\n• Announce weekly top performers\n• Create class leaderboards\n• Reward consistent practice\n• Celebrate score improvements\n\n✅ Early Intervention:\n• Monitor students with <40% scores\n• Contact parents of inactive students\n• Assign remedial practice tests\n• Track improvement weekly\n\n✅ Maximize Reports:\n• Export before parent meetings\n• Share with subject teachers\n• Use for academic planning\n• Document student progress"
  );

  addSection(
    "Exam Preparation Timeline:",
    "🎯 3 Months Before Exam:\n• Ensure all students registered\n• Complete syllabus coverage\n• Baseline assessment tests\n\n🎯 2 Months Before:\n• Intensive practice phase\n• Weekly progress reviews\n• Focus on weak subjects\n\n🎯 1 Month Before:\n• Mock exams using Edura\n• Daily practice sessions\n• Revision of weak topics\n\n🎯 2 Weeks Before:\n• Final practice tests\n• Confidence-building sessions\n• Exam strategy discussions\n\n🎯 Final Week:\n• Light practice only\n• Review mistakes\n• Mental preparation"
  );

  // Final Page - Quick Reference
  doc.addPage();
  yPosition = margin;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPosition, contentWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Quick Reference Guide", pageWidth / 2, yPosition + 13, { align: "center" });
  yPosition += 30;
  doc.setTextColor(0, 0, 0);

  addSection(
    "Essential Links:",
    "🌐 Login: www.edura.com.ng/school-login\n📚 Main Website: www.edura.com.ng\n📱 WhatsApp: +234 705 075 7085\n📧 Email: support@edura.com.ng"
  );

  addSection(
    "Dashboard Navigation:",
    "Overview → Key metrics & quick actions\nStudents → Add/manage student accounts\nReports → Generate analytics & exports\nBilling → Subscription & payments\nSettings → School profile & password"
  );

  addSection(
    "Emergency Contacts:",
    "For urgent issues (24/7):\n📱 +234 705 075 7085 (WhatsApp)\n\nFor general inquiries:\n📧 support@edura.com.ng"
  );

  addSection(
    "Subscription Pricing:",
    "1-50 students: ₦1,000/student\n51-100 students: ₦900/student\n101-200 students: ₦850/student\n201-250 students: ₦800/student\n250+ students: Custom pricing"
  );

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    
    // Page number
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    
    // Footer text
    doc.text(
      "Edura - Complete WAEC, JAMB & NECO CBT Practice Platform",
      margin,
      pageHeight - 10
    );
    
    // Website
    doc.text(
      "www.edura.com.ng",
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  doc.save("Edura-School-Dashboard-Manual.pdf");
};

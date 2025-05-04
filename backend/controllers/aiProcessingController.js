require("dotenv").config(); // Ensure env vars are loaded
// const { openai } = require("../config/aiConfig"); // Remove import from config
const { OpenAI } = require("openai/index.js"); // Import OpenAI class
const { getMeetingById } = require("../models/meeting");
const { updateMeetingSummaryAndTasks } = require("../models/aiModels");

// Initialize OpenAI client directly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// check if text is Arabic
function isArabic(text) {
  const arabicRegex = /[\u0600-\u06FF]/; 
  return arabicRegex.test(text);
}

// Define system prompts based on language
function getSystemPrompts(isArabicLang) {
  if (isArabicLang) {
    return {
      summaryPrompt: `
أنت مساعد متخصص وخبير في تحليل وتلخيص محاضر الاجتماعات باللغة العربية.
مهمتك هي قراءة نص الاجتماع التالي وتقديم ملخص شامل وموضوعي.
يجب أن يركز الملخص على:
- الغرض الرئيسي للاجتماع.
- أبرز النقاط التي تمت مناقشتها.
- القرارات الرئيسية التي تم اتخاذها (اذكرها بإيجاز ضمن السرد).
- النتائج أو الاستنتاجات الهامة.
- أي خطوات تالية عامة تم الاتفاق عليها (بدون الدخول في تفاصيل المهام الفردية).
اكتب الملخص بأسلوب رسمي وواضح باستخدام اللغة العربية الفصحى. تجنب الآراء الشخصية أو المعلومات غير الواردة في النص. يجب أن يكون الملخص فقرة أو عدة فقرات متماسكة. لا تقم بتضمين قائمة منفصلة بالملاحظات أو المخرجات هنا.
`.trim(),
      tasksPrompt: `
أنت مساعد متخصص ودقيق في استخراج وتوثيق الإجراءات المطلوبة من محاضر الاجتماعات باللغة العربية.
مهمتك هي تحليل نص الاجتماع التالي وتحديد قائمة واضحة ومنظمة بـ:
- المهام المحددة (Action Items) التي يجب تنفيذها.
- القرارات التي تتطلب إجراءً أو متابعة محددة.
- نقاط المتابعة (Follow-ups) المتفق عليها.
لكل عنصر في القائمة، إذا تم ذكره في النص، قم بتضمين:
- الشخص المسؤول عن التنفيذ (إن وجد).
- الموعد النهائي للتنفيذ (إن وجد).
قم بتنسيق الإخراج كقائمة نقطية واضحة (باستخدام '-' أو '*') لكل مهمة أو قرار أو نقطة متابعة.
قدم القائمة مباشرة بدون أي مقدمات أو جمل ختامية. ركز فقط على البنود التي تتطلب إجراءً أو متابعة. استخدم اللغة العربية الفصحى.
`.trim(),
    };
  } else {
    return {
      summaryPrompt: `
You are an expert AI assistant specialized in analyzing and summarizing English meeting transcripts.
Your task is to read the following transcript and provide a comprehensive, objective summary.
The summary should focus on:
- The main purpose of the meeting.
- Key discussion points and topics covered.
- Major decisions made (mention briefly within the narrative).
- Significant outcomes or conclusions reached.
- Any general next steps agreed upon (without detailing individual tasks).
Write the summary in a formal, clear, and concise style using professional English. Avoid personal opinions or information not present in the transcript. The output should be a coherent paragraph or set of paragraphs. Do *not* include a separate list of notes or outcomes here.
`.trim(),
      tasksPrompt: `
You are an expert AI assistant skilled in accurately extracting actionable items from English meeting transcripts.
Your task is to analyze the following transcript and identify a clear, structured list of:
- Specific tasks (Action Items) to be performed.
- Decisions that require a specific action or follow-up.
- Agreed-upon follow-up points.
For each item in the list, if mentioned in the transcript, include:
- The assigned owner (if specified).
- The deadline (if specified).
Format the output *only* as a clear bulleted list (using '-' or '*') for each task, decision, or follow-up item.
Present the list directly without any introductory or concluding sentences. Focus solely on items requiring action or tracking. Use formal and clear English.
`.trim(),
    };
  }
}

// Function to call OpenAI API
async function callOpenAI(systemPrompt, userContent) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Consider making model configurable
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: 5000, // Consider making max_tokens configurable
  });
  return response.choices[0].message.content;
}

// Controller function to process transcript for a specific meeting
async function processTranscript(req, res) {
  // Validation and Authorization should be handled by middleware in routes
  try {
    const { meetingId } = req.params; // Get meetingId from route params
    const transcriptText = req.body.message; // Assume transcript comes from body

    if (!transcriptText) {
      return res
        .status(400)
        .json({ message: "Transcript text (message) is required in the body" });
    }

    // Ensure the meeting exists
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    // Perform OpenAI processing
    const isArabicLang = isArabic(transcriptText);
    const { summaryPrompt, tasksPrompt } = getSystemPrompts(isArabicLang);

    const [summaryResult, tasksResult] = await Promise.allSettled([
      callOpenAI(summaryPrompt, transcriptText),
      callOpenAI(tasksPrompt, transcriptText),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
    const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : null;

    if (summaryResult.status !== 'fulfilled') {
        console.error(`OpenAI summary failed for meeting ${meetingId}:`, summaryResult.reason);
    }
    if (tasksResult.status !== 'fulfilled') {
        console.error(`OpenAI tasks failed for meeting ${meetingId}:`, tasksResult.reason);
    }

    // Update the meeting record in the database (only if at least one succeeded)
    let updatedMeeting = null;
    if (summary !== null || tasks !== null) {
         updatedMeeting = await updateMeetingSummaryAndTasks(meetingId, summary, tasks);
    }

    // Return the results
    res.json({
      message: "Transcript processing attempted.",
      summaryStatus: summaryResult.status,
      tasksStatus: tasksResult.status,
      summary: summary, // Echo back the generated summary (or null)
      tasks: tasks, // Echo back the generated tasks (or null)
      updatedMeeting: updatedMeeting, // Return updated meeting or null
    });
  } catch (error) {
    console.error("Error processing transcript or updating meeting:", error);
    if (error.message === "Meeting not found" || error.message === "Meeting not found or update failed") {
      return res.status(404).json({ message: error.message });
    }
    // Distinguish between OpenAI API errors and other server errors if possible
    const isApiError = error.response && error.response.data; // Basic check
    if (isApiError) {
       console.error("AI Service Error Response Data:", error.response.data);
       console.error("AI Service Error Response Status:", error.response.status);
       return res.status(500).json({ message: "Error communicating with AI service." });
    }
    // Generic server error
    res.status(500).json({ message: "Server error processing transcript" });
  }
}

module.exports = {
  isArabic,
  getSystemPrompts,
  callOpenAI,
  processTranscript,
}; 
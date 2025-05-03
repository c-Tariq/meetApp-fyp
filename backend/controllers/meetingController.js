const {
  createMeeting,
  getMeetingsBySpaceId,
  getMeetingById,
  searchMeetingsByName,
  updateMeetingStatus,
  updateMeetingSummaryAndTasks,
  updateMeetingDetails,
  deleteMeetingById,
} = require("../models/meeting");
const { isSpaceAdmin } = require("../models/space");
const openai = require("../config/openaiConfig");

exports.createMeeting = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const { title, scheduled_time } = req.body;
    const user_id = req.user.user_id; // Use authenticated user's ID

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to create a meeting" });
    }

    if (!title || !scheduled_time) {
      return res
        .status(400)
        .json({ message: "Title and scheduled time are required" });
    }

    const newMeeting = await createMeeting(spaceId, title, scheduled_time);
    res.status(201).json(newMeeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getSpaceMeetings = async (req, res) => {
  try {
    const { spaceId } = req.params;
    const meetings = await getMeetingsBySpaceId(spaceId);
    res.json(meetings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.json(meeting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.searchMeetings = async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ message: "Search term is required" });
    }
    const results = await searchMeetingsByName(term);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Utility to check if text is Arabic
function isArabic(text) {
  const arabicRegex = /[\u0600-\u06FF]/; // Unicode range for Arabic
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
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: 5000,
  });
  return response.choices[0].message.content;
}

// Controller function to process transcript for a specific meeting
exports.processTranscript = async function (req, res) {
  // Validation (meetingId format) handled by express-validator in routes
  // Authorization (space membership) handled by checkSpaceMembership middleware
  try {
    const { meetingId } = req.params; // Get meetingId from route params
    const transcriptText = req.body.message; // Still assume transcript comes from body for now
    
    if (!transcriptText) {
      return res.status(400).json({ message: "Transcript text (message) is required in the body" });
    }

    // Ensure the meeting exists (redundant check if checkSpaceMembership derives spaceId via meeting, but good practice)
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found.' });
    }

    // Perform OpenAI processing
    const isArabicLang = isArabic(transcriptText);
    const { summaryPrompt, tasksPrompt } = getSystemPrompts(isArabicLang);

    const [summary, tasks] = await Promise.all([
      callOpenAI(summaryPrompt, transcriptText),
      callOpenAI(tasksPrompt, transcriptText),
    ]);

    // Update the meeting record in the database
    const updatedMeeting = await updateMeetingSummaryAndTasks(meetingId, summary, tasks);

    // Return the results and/or updated meeting
    res.json({
      message: "Transcript processed and meeting updated successfully.",
      summary: summary, // Echo back the generated summary
      tasks: tasks,     // Echo back the generated tasks
      updatedMeeting: updatedMeeting // Return the updated meeting object
    });

  } catch (error) {
    console.error("Error processing transcript or updating meeting:", error);
    if (error.response) { // Check for OpenAI specific errors
      console.error("OpenAI Error Response Data:", error.response.data);
      console.error("OpenAI Error Response Status:", error.response.status);
      return res.status(500).json({ message: "Error communicating with AI service." });
    } else if (error.message === 'Meeting not found or update failed') {
        return res.status(404).json({ message: error.message });
    } 
    // Generic server error
    res.status(500).json({ message: "Server error processing transcript" });
  }
};

exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { spaceId } = req.params;
    const { status } = req.body; // Expecting { "status": "In Progress" | "Concluded" | "Upcoming" }
    const user_id = req.user.user_id;

    // 1. Validate input status
    const allowedStatuses = ["Upcoming", "In Progress", "Concluded"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid or missing status. Must be one of: Upcoming, In Progress, Concluded.",
      });
    }

    const isAdmin = await isSpaceAdmin(spaceId, user_id);
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to update this meeting's status",
      });
    }

    const updatedMeeting = await updateMeetingStatus(meetingId, status);
    if (!updatedMeeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found during update attempt." });
    }
    res.status(200).json(updatedMeeting);
  } catch (err) {
    console.error("Error updating meeting status:", err.message);
    if (err.message.includes("Invalid status value")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).send("Server Error");
  }
};

// Controller function for PATCH /:meetingId to update details
exports.updateMeetingDetails = async (req, res) => {
  // Validation and Authorization handled by middleware in routes
  try {
    const { meetingId } = req.params;
    // Extract only the allowed fields from the request body
    const { title, scheduled_time } = req.body; 
    const updates = { title, scheduled_time }; // Map to DB columns if needed here or in model

    // Check if the user has permission (e.g., is admin or meeting creator)
    // Assuming checkSpaceMembership is sufficient for now, but could add stricter checks
    // const meeting = await getMeetingById(meetingId); // Fetch meeting if needed for creator check
    // if (meeting.creator_id !== req.user.user_id && !await isSpaceAdmin(req.params.spaceId, req.user.user_id)) {
    //   return res.status(403).json({ message: 'Forbidden: Not meeting creator or space admin' });
    // }

    const updatedMeeting = await updateMeetingDetails(meetingId, updates);

    if (!updatedMeeting) {
      // This case is handled by the model throwing an error, but added for clarity
      return res.status(404).json({ message: 'Meeting not found or update failed.' });
    }

    // TODO: Consider transforming keys to camelCase before sending
    res.status(200).json(updatedMeeting);

  } catch (error) {
    console.error("Error updating meeting details:", error);
    if (error.message === 'Meeting not found or update failed') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error updating meeting details" });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId, spaceId } = req.params; // Get both IDs from params
    const userId = req.user.user_id; // Authenticated user

    // Authorization: Check if the user is the admin of the space containing the meeting
    const isAdmin = await isSpaceAdmin(spaceId, userId);
    if (!isAdmin) {
      return res.status(403).json({
        message: "Unauthorized: Only space administrators can delete meetings.",
      });
    }

    // Delete the meeting using the model function
    const deletedMeeting = await deleteMeetingById(meetingId);

    if (!deletedMeeting) {
      // This implies the meeting didn't exist in the first place
      return res.status(404).json({ message: "Meeting not found." });
    }

    // Respond with success (204 No Content is standard for DELETE)
    res.status(204).send();

  } catch (err) {
    console.error(`Error deleting meeting ${req.params.meetingId}:`, err.message);
    res.status(500).json({ message: "Server Error deleting meeting." });
  }
};

// Export helpers for use in recordingController
module.exports.isArabic = isArabic;
module.exports.getSystemPrompts = getSystemPrompts;
module.exports.callOpenAI = callOpenAI;

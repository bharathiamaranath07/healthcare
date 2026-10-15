/* MediScribe AI — frontend prototype
   1) Paste your Supabase URL and anon/publishable key below.
   2) Microphone transcription uses the browser Web Speech API.
   3) AI note generation uses the Supabase Edge Function when configured;
      otherwise it uses a clearly-labelled local demo formatter.
*/
// // Supabase publishable/anon key (never service_role)
// const supabaseUrlIsValid = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL);
// const supabaseConfigured = supabaseUrlIsValid && SUPABASE_ANON_KEY.length > 20;
// const supabaseClient = supabaseConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
// const supabaseConfigMessage = "Set SUPABASE_URL to your project API URL (https://<project-ref>.supabase.co) in app.js. Do not use a database or pooler connection string.";

// const $ = (id) => document.getElementById(id);
// const LOCAL_KEY = "mediscribe_demo_notes_v1";
// let currentUser = null;
// let recognition = null;
// let isRecording = false;
// let currentNoteId = null;
// let toastTimer;

// function toast(message) {
//   $("toast").textContent = message;
//   $("toast").classList.add("show");
//   clearTimeout(toastTimer);
//   toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
// }
// function setMessage(id, message, isError = false) {
//   $(id).textContent = message;
//   $(id).style.color = isError ? "#b23b49" : "";
// }
// function localNotes() {
//   try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
// }
// function storeLocalNotes(notes) { localStorage.setItem(LOCAL_KEY, JSON.stringify(notes)); }
// function escapeHTML(value) {
//   return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
// }
// function transcript() { return $("transcriptInput").value.trim(); }
// function updateWordCount() {
//   const count = transcript() ? transcript().split(/\s+/).length : 0;
//   $("wordCount").textContent = `${count} word${count === 1 ? "" : "s"}`;
// }
// function getNoteFromForm() {
//   return {
//     id: currentNoteId,
//     patient_label: $("patientLabel").value.trim() || "Untitled visit",
//     subjective: $("subjective").value.trim(),
//     objective: $("objective").value.trim(),
//     assessment: $("assessment").value.trim(),
//     plan: $("plan").value.trim(),
//     transcript: transcript(),
//     updated_at: new Date().toISOString()
//   };
// }
// function showNote(note) {
//   currentNoteId = note.id || null;
//   $("emptyState").classList.add("hidden");
//   $("noteEditor").classList.remove("hidden");
//   $("patientLabel").value = note.patient_label || "";
//   $("subjective").value = note.subjective || "";
//   $("objective").value = note.objective || "";
//   $("assessment").value = note.assessment || "";
//   $("plan").value = note.plan || "";
//   const flags = Array.isArray(note.review_flags) ? note.review_flags : [];
//   if (flags.length) {
//     $("reviewFlags").classList.remove("hidden");
//     $("reviewFlags").innerHTML = `<strong>⚠ Please verify before signing</strong><ul>${flags.map(f => `<li>${escapeHTML(f)}</li>`).join("")}</ul>`;
//   } else {
//     $("reviewFlags").classList.add("hidden");
//     $("reviewFlags").innerHTML = "";
//   }
//   setMessage("saveMessage", "");
// }
// function heuristicNotes(text) {
//   const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
//   const subjective = [];
//   const objective = [];
//   const plan = [];
//   const flags = [];
//   for (const sentence of sentences) {
//     const s = sentence.trim();
//     if (/\b(check|measure|record|monitor|vital|temperature|oxygen saturation|follow.?up|review|prescribe|start|stop|continue|administer|refer)\b/i.test(s)) plan.push(s);
//     else if (/\b(no |denies|without|not present|negative for)\b/i.test(s) || /\b(feel|pain|fever|cough|nausea|dizziness|breathlessness|history|since|for \d+ days?)\b/i.test(s)) subjective.push(s);
//     else if (/\b(blood pressure|pulse|temperature|oxygen saturation|spo2|examination|heart rate|respiratory rate)\b/i.test(s)) objective.push(s);
//     else subjective.push(s);
//   }
//   if (/\b(mg|mcg|ml|mL|tablet|capsule|dose|dosage|twice daily|once daily|bd|tds|qhs)\b/i.test(text)) flags.push("Medication or dosage-related text detected. Verify the exact drug, strength, units, frequency and duration.");
//   if (/\b(no|not|denies|without|negative)\b/i.test(text)) flags.push("Negation detected. Confirm that symptoms marked absent remain correctly documented.");
//   if (!/\b(diagnos|assessment|impression)\b/i.test(text)) flags.push("No explicit diagnosis was detected. Do not infer one; clinician assessment is required.");
//   return {
//     subjective: subjective.join(" ") || "Not documented in the transcript.",
//     objective: objective.join(" ") || "No objective measurements were explicitly documented.",
//     assessment: "Diagnosis not explicitly stated in the transcript. Clinician assessment required.",
//     plan: plan.join(" ") || "No explicit plan was documented in the transcript.",
//     review_flags: flags
//   };
// }
// async function generateNotes() {
//   const text = transcript();
//   if (!text) { toast("Record or enter a transcript first."); $("transcriptInput").focus(); return; }
//   const btn = $("generateBtn");
//   btn.disabled = true; btn.textContent = "Generating notes…";
//   try {
//     let result;
//     if (supabaseClient && currentUser) {
//       const { data, error } = await supabaseClient.functions.invoke("generate-notes", { body: { transcript: text } });
//       if (error) throw error;
//       result = data;
//     } else {
//       result = heuristicNotes(text);
//       toast("Demo formatter used. Configure Supabase + Edge Function for AI-generated notes.");
//     }
//     showNote({ ...result, patient_label: $("patientLabel").value || "Demo visit" });
//   } catch (err) {
//     console.error(err);
//     result = heuristicNotes(text);
//     showNote({ ...result, patient_label: $("patientLabel").value || "Demo visit" });
//     toast("AI service unavailable; showing demo-formatted notes.");
//   } finally {
//     btn.disabled = false; btn.innerHTML = 'Generate clinical notes <span>→</span>';
//   }
// }
// function buildPlainText(note = getNoteFromForm()) {
//   return `MEDISCRIBE AI — CLINICAL NOTE\nPatient/visit: ${note.patient_label}\nDate: ${new Date(note.updated_at || Date.now()).toLocaleString()}\n\nS — SUBJECTIVE\n${note.subjective}\n\nO — OBJECTIVE\n${note.objective}\n\nA — ASSESSMENT\n${note.assessment}\n\nP — PLAN\n${note.plan}\n\nSource transcript:\n${note.transcript || transcript()}\n\nDRAFT ONLY — Must be reviewed and approved by a qualified clinician.`;
// }
// async function copyNote() {
//   try { await navigator.clipboard.writeText(buildPlainText()); toast("Clinical note copied."); }
//   catch { toast("Clipboard unavailable. Use Download .txt instead."); }
// }
// function downloadNote() {
//   const blob = new Blob([buildPlainText()], { type: "text/plain;charset=utf-8" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a"); a.href = url; a.download = "mediscribe-clinical-note.txt"; a.click();
//   URL.revokeObjectURL(url);
// }
// async function saveNote() {
//   const note = getNoteFromForm();
//   if (!note.subjective && !note.objective && !note.assessment && !note.plan) { toast("Generate or enter a note before saving."); return; }
//   try {
//     if (supabaseClient && currentUser) {
//       const payload = { user_id: currentUser.id, patient_label: note.patient_label, subjective: note.subjective, objective: note.objective, assessment: note.assessment, plan: note.plan, transcript: note.transcript };
//       let query;
//       if (currentNoteId) query = await supabaseClient.from("clinical_notes").update(payload).eq("id", currentNoteId).select().single();
//       else query = await supabaseClient.from("clinical_notes").insert(payload).select().single();
//       if (query.error) throw query.error;
//       currentNoteId = query.data.id;
//       toast("Note saved to Supabase.");
//     } else {
//       const notes = localNotes();
//       const entry = { ...note, id: currentNoteId || `local-${Date.now()}` };
//       const index = notes.findIndex(n => n.id === entry.id);
//       if (index >= 0) notes[index] = entry; else notes.unshift(entry);
//       storeLocalNotes(notes);
//       currentNoteId = entry.id;
//       toast("Note saved in this browser only.");
//     }
//     setMessage("saveMessage", "Saved. This prototype does not sign or finalize clinical records.");
//     await loadHistory();
//   } catch (err) {
//     console.error(err); setMessage("saveMessage", err.message || "Could not save note.", true); toast("Save failed. Check Supabase setup and database policies.");
//   }
// }
// async function loadHistory() {
//   let notes = [];
//   try {
//     if (supabaseClient && currentUser) {
//       const { data, error } = await supabaseClient.from("clinical_notes").select("*").order("created_at", { ascending: false }).limit(30);
//       if (error) throw error;
//       notes = data || [];
//     } else notes = localNotes().sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
//   } catch (err) { console.error(err); $("historyList").innerHTML = '<p class="history-empty">Could not load cloud notes. Check your Supabase table and RLS policies.</p>'; return; }
//   if (!notes.length) { $("historyList").innerHTML = '<p class="history-empty">No saved notes yet. Generate a note and save it to see it here.</p>'; return; }
//   $("historyList").innerHTML = notes.map(n => `<article class="history-item"><div><strong>${escapeHTML(n.patient_label || "Untitled visit")}</strong><small>${escapeHTML(new Date(n.created_at || n.updated_at || Date.now()).toLocaleString())} · ${escapeHTML((n.subjective || "").slice(0,90))}</small></div><div class="history-actions"><button class="btn btn-secondary" data-open="${escapeHTML(n.id)}">Open</button><button class="btn btn-secondary" data-delete="${escapeHTML(n.id)}">Delete</button></div></article>`).join("");
//   $("historyList").querySelectorAll("[data-open]").forEach(btn => btn.addEventListener("click", () => openNote(btn.dataset.open)));
//   $("historyList").querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deleteNote(btn.dataset.delete)));
// }
// async function openNote(id) {
//   let note;
//   if (supabaseClient && currentUser && !String(id).startsWith("local-")) {
//     const { data, error } = await supabaseClient.from("clinical_notes").select("*").eq("id", id).single();
//     if (error) { toast("Could not open note."); return; } note = data;
//   } else note = localNotes().find(n => n.id === id);
//   if (!note) return;
//   showNote(note);
//   if (note.transcript) $("transcriptInput").value = note.transcript;
//   updateWordCount(); $("noteEditor").scrollIntoView({ behavior: "smooth", block: "start" });
// }
// async function deleteNote(id) {
//   if (!confirm("Delete this saved note?")) return;
//   try {
//     if (supabaseClient && currentUser && !String(id).startsWith("local-")) {
//       const { error } = await supabaseClient.from("clinical_notes").delete().eq("id", id);
//       if (error) throw error;
//     } else storeLocalNotes(localNotes().filter(n => n.id !== id));
//     if (currentNoteId === id) { currentNoteId = null; $("noteEditor").classList.add("hidden"); $("emptyState").classList.remove("hidden"); }
//     await loadHistory(); toast("Note deleted.");
//   } catch (err) { console.error(err); toast("Delete failed."); }
// }
// function setupSpeechRecognition() {
//   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//   if (!SpeechRecognition) {
//     $("recordBtn").disabled = true; $("recordHelp").textContent = "Speech recognition is not supported in this browser. Use Chrome/Edge or type the transcript.";
//     return;
//   }
//   recognition = new SpeechRecognition();
//   recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-IN";
//   recognition.onstart = () => {
//     isRecording = true; $("recordBtn").innerHTML = "<span>■</span> Stop recording"; $("recordTitle").textContent = "Listening…"; $("recordHelp").textContent = "Speak clearly. Select Stop recording when finished."; $("recordIndicator").classList.add("recording");
//   };
//   recognition.onresult = event => {
//     let interim = "";
//     let finalText = $("transcriptInput").dataset.speechFinal || "";
//     for (let i = event.resultIndex; i < event.results.length; i++) {
//       const phrase = event.results[i][0].transcript;
//       if (event.results[i].isFinal) finalText += phrase + " "; else interim += phrase;
//     }
//     $("transcriptInput").dataset.speechFinal = finalText;
//     $("transcriptInput").value = (finalText + interim).trim();
//     updateWordCount();
//   };
//   recognition.onerror = event => { $("recordHelp").textContent = `Speech recognition error: ${event.error}. You can type the transcript instead.`; };
//   recognition.onend = () => {
//     isRecording = false; $("recordBtn").innerHTML = "<span>●</span> Start recording"; $("recordTitle").textContent = "Recording stopped"; $("recordIndicator").classList.remove("recording"); updateWordCount();
//   };
// }
// async function authSubmit(mode) {
//   if (!$("authForm").reportValidity()) return;
//   if (!supabaseClient) { setMessage("authMessage", supabaseConfigMessage, true); return; }
//   const email = $("emailInput").value.trim(), password = $("passwordInput").value;
//   try {
//     const result = mode === "signup"
//       ? await supabaseClient.auth.signUp({ email, password })
//       : await supabaseClient.auth.signInWithPassword({ email, password });
//     if (result.error) throw result.error;
//     if (mode === "signup" && !result.data.session) setMessage("authMessage", "Account created. Check your email to confirm, then sign in.");
//     else { currentUser = result.data.user; await updateAuthUI(); setMessage("authMessage", "Signed in."); await loadHistory(); }
//   } catch (err) { setMessage("authMessage", err.message || "Authentication failed.", true); }
// }
// async function updateAuthUI() {
//   $("connectionStatus").textContent = !supabaseClient ? "Local demo mode" : currentUser ? "Supabase connected" : "Supabase configured";
//   $("signOutBtn").classList.toggle("hidden", !currentUser);
//   $("authPanel").classList.toggle("hidden", !!currentUser);
//   if (currentUser) await loadHistory();
// }
// $("recordBtn").addEventListener("click", () => {
//   if (!recognition) return;
//   if (isRecording) recognition.stop();
//   else {
//     $("transcriptInput").dataset.speechFinal = $("transcriptInput").value ? $("transcriptInput").value + " " : "";
//     try { recognition.start(); } catch { toast("Recorder is already starting. Try again in a moment."); }
//   }
// });
// $("transcriptInput").addEventListener("input", updateWordCount);
// $("loadExampleBtn").addEventListener("click", () => {
//   $("transcriptInput").value = "Patient has fever for three days and cough since yesterday. No history of breathlessness. Check temperature and oxygen saturation. Review after two days.";
//   $("transcriptInput").dataset.speechFinal = ""; updateWordCount(); toast("Demo transcript loaded.");
// });
// $("clearBtn").addEventListener("click", () => { $("transcriptInput").value = ""; $("transcriptInput").dataset.speechFinal = ""; updateWordCount(); });
// $("generateBtn").addEventListener("click", generateNotes);
// $("copyBtn").addEventListener("click", copyNote);
// $("downloadBtn").addEventListener("click", downloadNote);
// $("saveBtn").addEventListener("click", saveNote);
// $("refreshBtn").addEventListener("click", loadHistory);
// $("authForm").addEventListener("submit", e => { e.preventDefault(); authSubmit("signin"); });
// $("signUpBtn").addEventListener("click", () => authSubmit("signup"));
// $("signOutBtn").addEventListener("click", async () => { await supabaseClient.auth.signOut(); currentUser = null; await updateAuthUI(); toast("Signed out."); });
// setupSpeechRecognition();
// updateWordCount();
// if (supabaseClient) {
//   supabaseClient.auth.getSession().then(({ data }) => { currentUser = data.session?.user || null; updateAuthUI(); });
//   supabaseClient.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; updateAuthUI(); });
// } else {
//   $("authPanel").classList.remove("hidden");
//   $("connectionStatus").textContent = "Local demo mode";
//   setMessage("authMessage", supabaseConfigMessage, true);
// }
// loadHistory();



/* MediScribe AI — frontend prototype */
 const SUPABASE_URL = "https://krhmcvpoxfxykcjvabmv.supabase.co";
 const SUPABASE_ANON_KEY = "sb_publishable_Zn3INXASHRfwWze4TF2plA_nh-Mg7cy";
 const supabaseConfigured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;
const supabaseClient = supabaseConfigured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = "mediscribe_demo_notes_v1";
let currentUser = null;
let recognition = null;
let isRecording = false;
let currentNoteId = null;
let toastTimer;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
}

function setMessage(id, message, isError = false) {
  $(id).textContent = message;
  $(id).style.color = isError ? "#b23b49" : "";
}

function localNotes() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function storeLocalNotes(notes) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function transcript() {
  return $("transcriptInput").value.trim();
}

function updateWordCount() {
  const count = transcript() ? transcript().split(/\s+/).length : 0;
  $("wordCount").textContent = `${count} word${count === 1 ? "" : "s"}`;
}

function getNoteFromForm() {
  return {
    id: currentNoteId,
    patient_label: $("patientLabel").value.trim() || "Untitled visit",
    subjective: $("subjective").value.trim(),
    objective: $("objective").value.trim(),
    assessment: $("assessment").value.trim(),
    plan: $("plan").value.trim(),
    transcript: transcript(),
    updated_at: new Date().toISOString()
  };
}

function showNote(note) {
  currentNoteId = note.id || null;
  $("emptyState").classList.add("hidden");
  $("noteEditor").classList.remove("hidden");
  $("patientLabel").value = note.patient_label || "";
  $("subjective").value = note.subjective || "";
  $("objective").value = note.objective || "";
  $("assessment").value = note.assessment || "";
  $("plan").value = note.plan || "";

  const flags = Array.isArray(note.review_flags) ? note.review_flags : [];

  if (flags.length) {
    $("reviewFlags").classList.remove("hidden");
    $("reviewFlags").innerHTML =
      `<strong>⚠ Please verify before signing</strong><ul>${flags.map(f => `<li>${escapeHTML(f)}</li>`).join("")}</ul>`;
  } else {
    $("reviewFlags").classList.add("hidden");
    $("reviewFlags").innerHTML = "";
  }

  setMessage("saveMessage", "");
}

async function generateNotes() {
  const text = transcript();

  if (!text) {
    toast("Record or enter a transcript first.");
    $("transcriptInput").focus();
    return;
  }

  const btn = $("generateBtn");
  btn.disabled = true;
  btn.textContent = "Generating notes…";

  try {
    if (!supabaseClient) {
      throw new Error("Supabase is not configured. Add your Project URL and publishable key in app.js.");
    }

    if (!currentUser) {
      throw new Error("Please sign in before generating AI clinical notes.");
    }

    const { data, error } = await supabaseClient.functions.invoke(
      "generate-notes",
      { body: { transcript: text } }
    );

    if (error) {
      let details = error.message || "The Edge Function request failed.";

      if (error.context && typeof error.context.json === "function") {
        try {
          const body = await error.context.json();
          if (body && body.error) details = body.error;
        } catch (_) {
          // Keep the original error message.
        }
      }

      throw new Error(details);
    }

    if (!data || data.error) {
      throw new Error(data?.error || "The AI function returned an empty response.");
    }

    const note = {
      patient_label: $("patientLabel").value.trim() || "Demo visit",
      subjective: typeof data.subjective === "string" && data.subjective.trim()
        ? data.subjective.trim()
        : "Not documented in the transcript.",
      objective: typeof data.objective === "string" && data.objective.trim()
        ? data.objective.trim()
        : "Not documented in the transcript.",
      assessment: typeof data.assessment === "string" && data.assessment.trim()
        ? data.assessment.trim()
        : "Diagnosis not specified in the transcript. Clinician assessment required.",
      plan: typeof data.plan === "string" && data.plan.trim()
        ? data.plan.trim()
        : "Not documented in the transcript.",
      review_flags: Array.isArray(data.review_flags) ? data.review_flags : [],
      transcript: text,
      updated_at: new Date().toISOString()
    };

    showNote(note);
    toast("Draft SOAP note generated. Review it before signing.");
  } catch (err) {
    console.error("MediScribe generate-notes error:", err);
    toast(err instanceof Error
      ? err.message
      : "AI note generation failed. Check the Edge Function logs.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Generate clinical notes <span>→</span>';
  }
}

function buildPlainText(note = getNoteFromForm()) {
  return `MEDISCRIBE AI — CLINICAL NOTE
Patient/visit: ${note.patient_label}
Date: ${new Date(note.updated_at || Date.now()).toLocaleString()}

S — SUBJECTIVE
${note.subjective}

O — OBJECTIVE
${note.objective}

A — ASSESSMENT
${note.assessment}

P — PLAN
${note.plan}

Source transcript:
${note.transcript || transcript()}

DRAFT ONLY — Must be reviewed and approved by a qualified clinician.`;
}

async function copyNote() {
  try {
    await navigator.clipboard.writeText(buildPlainText());
    toast("Clinical note copied.");
  } catch {
    toast("Clipboard unavailable. Use Download .txt instead.");
  }
}

function downloadNote() {
  const blob = new Blob([buildPlainText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mediscribe-clinical-note.txt";
  a.click();
  URL.revokeObjectURL(url);
}

async function saveNote() {
  const note = getNoteFromForm();

  if (!note.subjective && !note.objective && !note.assessment && !note.plan) {
    toast("Generate or enter a note before saving.");
    return;
  }

  try {
    if (supabaseClient && currentUser) {
      const payload = {
        user_id: currentUser.id,
        patient_label: note.patient_label,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        transcript: note.transcript
      };

      let query;

      if (currentNoteId) {
        query = await supabaseClient
          .from("clinical_notes")
          .update(payload)
          .eq("id", currentNoteId)
          .select()
          .single();
      } else {
        query = await supabaseClient
          .from("clinical_notes")
          .insert(payload)
          .select()
          .single();
      }

      if (query.error) throw query.error;

      currentNoteId = query.data.id;
      toast("Note saved to Supabase.");
    } else {
      const notes = localNotes();
      const entry = { ...note, id: currentNoteId || `local-${Date.now()}` };
      const index = notes.findIndex(n => n.id === entry.id);

      if (index >= 0) notes[index] = entry;
      else notes.unshift(entry);

      storeLocalNotes(notes);
      currentNoteId = entry.id;
      toast("Note saved in this browser only.");
    }

    setMessage("saveMessage", "Saved. This prototype does not sign or finalize clinical records.");
    await loadHistory();
  } catch (err) {
    console.error(err);
    setMessage("saveMessage", err.message || "Could not save note.", true);
    toast("Save failed. Check Supabase setup and database policies.");
  }
}

async function loadHistory() {
  let notes = [];

  try {
    if (supabaseClient && currentUser) {
      const { data, error } = await supabaseClient
        .from("clinical_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      notes = data || [];
    } else {
      notes = localNotes().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  } catch (err) {
    console.error(err);
    $("historyList").innerHTML =
      '<p class="history-empty">Could not load cloud notes. Check your Supabase table and RLS policies.</p>';
    return;
  }

  if (!notes.length) {
    $("historyList").innerHTML =
      '<p class="history-empty">No saved notes yet. Generate a note and save it to see it here.</p>';
    return;
  }

  $("historyList").innerHTML = notes.map(n =>
    `<article class="history-item">
      <div>
        <strong>${escapeHTML(n.patient_label || "Untitled visit")}</strong>
        <small>${escapeHTML(new Date(n.created_at || n.updated_at || Date.now()).toLocaleString())} · ${escapeHTML((n.subjective || "").slice(0, 90))}</small>
      </div>
      <div class="history-actions">
        <button class="btn btn-secondary" data-open="${escapeHTML(n.id)}">Open</button>
        <button class="btn btn-secondary" data-delete="${escapeHTML(n.id)}">Delete</button>
      </div>
    </article>`
  ).join("");

  $("historyList").querySelectorAll("[data-open]").forEach(btn =>
    btn.addEventListener("click", () => openNote(btn.dataset.open))
  );

  $("historyList").querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => deleteNote(btn.dataset.delete))
  );
}

async function openNote(id) {
  let note;

  if (supabaseClient && currentUser && !String(id).startsWith("local-")) {
    const { data, error } = await supabaseClient
      .from("clinical_notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast("Could not open note.");
      return;
    }

    note = data;
  } else {
    note = localNotes().find(n => n.id === id);
  }

  if (!note) return;

  showNote(note);

  if (note.transcript) $("transcriptInput").value = note.transcript;

  updateWordCount();
  $("noteEditor").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteNote(id) {
  if (!confirm("Delete this saved note?")) return;

  try {
    if (supabaseClient && currentUser && !String(id).startsWith("local-")) {
      const { error } = await supabaseClient
        .from("clinical_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } else {
      storeLocalNotes(localNotes().filter(n => n.id !== id));
    }

    if (currentNoteId === id) {
      currentNoteId = null;
      $("noteEditor").classList.add("hidden");
      $("emptyState").classList.remove("hidden");
    }

    await loadHistory();
    toast("Note deleted.");
  } catch (err) {
    console.error(err);
    toast("Delete failed.");
  }
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    $("recordBtn").disabled = true;
    $("recordHelp").textContent =
      "Speech recognition is not supported in this browser. Use Chrome/Edge or type the transcript.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-IN";

  recognition.onstart = () => {
    isRecording = true;
    $("recordBtn").innerHTML = "<span>■</span> Stop recording";
    $("recordTitle").textContent = "Listening…";
    $("recordHelp").textContent = "Speak clearly. Select Stop recording when finished.";
    $("recordIndicator").classList.add("recording");
  };

  recognition.onresult = event => {
    let interim = "";
    let finalText = $("transcriptInput").dataset.speechFinal || "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const phrase = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += phrase + " ";
      else interim += phrase;
    }

    $("transcriptInput").dataset.speechFinal = finalText;
    $("transcriptInput").value = (finalText + interim).trim();
    updateWordCount();
  };

  recognition.onerror = event => {
    $("recordHelp").textContent =
      `Speech recognition error: ${event.error}. You can type the transcript instead.`;
  };

  recognition.onend = () => {
    isRecording = false;
    $("recordBtn").innerHTML = "<span>●</span> Start recording";
    $("recordTitle").textContent = "Recording stopped";
    $("recordIndicator").classList.remove("recording");
    updateWordCount();
  };
}

async function authSubmit(mode) {
  if (!supabaseClient) {
    setMessage("authMessage", "Add your Supabase URL and publishable/anon key in app.js first.", true);
    return;
  }

  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;

  try {
    const result = mode === "signup"
      ? await supabaseClient.auth.signUp({ email, password })
      : await supabaseClient.auth.signInWithPassword({ email, password });

    if (result.error) throw result.error;

    if (mode === "signup" && !result.data.session) {
      setMessage("authMessage", "Account created. Check your email to confirm, then sign in.");
    } else {
      currentUser = result.data.user;
      await updateAuthUI();
      setMessage("authMessage", "Signed in.");
      await loadHistory();
    }
  } catch (err) {
    setMessage("authMessage", err.message || "Authentication failed.", true);
  }
}

async function updateAuthUI() {
  $("connectionStatus").textContent =
    !supabaseClient ? "Local demo mode" : currentUser ? "Supabase connected" : "Supabase configured";

  $("signOutBtn").classList.toggle("hidden", !currentUser);
  $("authPanel").classList.toggle("hidden", !!currentUser);

  if (currentUser) await loadHistory();
}

$("recordBtn").addEventListener("click", () => {
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
  } else {
    $("transcriptInput").dataset.speechFinal =
      $("transcriptInput").value ? $("transcriptInput").value + " " : "";

    try {
      recognition.start();
    } catch {
      toast("Recorder is already starting. Try again in a moment.");
    }
  }
});

$("transcriptInput").addEventListener("input", updateWordCount);

$("loadExampleBtn").addEventListener("click", () => {
  $("transcriptInput").value =
    "Patient has fever for three days and cough since yesterday. No history of breathlessness. Check temperature and oxygen saturation. Review after two days.";
  $("transcriptInput").dataset.speechFinal = "";
  updateWordCount();
  toast("Demo transcript loaded.");
});

$("clearBtn").addEventListener("click", () => {
  $("transcriptInput").value = "";
  $("transcriptInput").dataset.speechFinal = "";
  updateWordCount();
});

$("generateBtn").addEventListener("click", generateNotes);
$("copyBtn").addEventListener("click", copyNote);
$("downloadBtn").addEventListener("click", downloadNote);
$("saveBtn").addEventListener("click", saveNote);
$("refreshBtn").addEventListener("click", loadHistory);

$("authForm").addEventListener("submit", e => {
  e.preventDefault();
  authSubmit("signin");
});

$("signUpBtn").addEventListener("click", () => authSubmit("signup"));

$("signOutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  currentUser = null;
  await updateAuthUI();
  toast("Signed out.");
});

setupSpeechRecognition();
updateWordCount();

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => {
    currentUser = data.session?.user || null;
    updateAuthUI();
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
  });
} else {
  $("authPanel").classList.remove("hidden");
  $("connectionStatus").textContent = "Local demo mode";
}

loadHistory();
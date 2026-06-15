## 1. Code Explanation
**When to use:** You're looking at code you didn't write (or wrote a while ago) and need to understand what it does before changing it.

**Template:**
```
Explain what this [language] code does, step by step.
I'm a [beginner/intermediate] developer, so explain any tricky parts in simple terms.

[paste code here]
```

**Example:**
```
Explain what this JavaScript code does, step by step.
I'm a beginner developer, so explain any tricky parts in simple terms.

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

## 2. Debugging an Error
**When to use:** Your code throws an error and you don't know why.

**Template:**
```
My [language] code is throwing this error:
"[paste the exact error message]"

Here is the relevant code:
[paste code]

Please explain:
1. Why this error is happening
2. How to fix it
3. The corrected code
```

**Example:**
```
My Python code is throwing this error:
"TypeError: 'NoneType' object is not subscriptable"

Here is the relevant code:
def get_user(id):
    user = db.find(id)
    return user["name"]

Please explain:
1. Why this error is happening
2. How to fix it
3. The corrected code
```

---

## 3. Summarizing Text/Documents
**When to use:** You have a long article, doc, or message thread and need the key points fast.

**Template:**
```
Summarize the following [text/article/document] in [3-5] bullet points.
Focus specifically on [what matters to you, e.g. "action items" or "risks"].
Write it for someone who [context, e.g. "hasn't read the original"].

[paste text]
```

**Example:**
```
Summarize the following meeting notes in 3 bullet points.
Focus specifically on action items and who owns them.
Write it for someone who missed the meeting.

[paste notes]
```

---

## 4. Brainstorming Ideas
**When to use:** You need options/ideas before deciding on a direction.

**Template:**
```
Give me [number] ideas for [what you need], aimed at [target audience].
For each idea, include:
- A one-line description
- One reason it could work
- One potential downside
```

**Example:**
```
Give me 5 ideas for a welcome email for new app users, aimed at first-time users
who haven't used the app yet.
For each idea, include:
- A one-line description
- One reason it could work
- One potential downside
```

---

## 5. Step-by-Step Reasoning (for complex problems)
**When to use:** The task involves multiple steps or decisions, and you want to see *how* the answer was reached (not just the final answer) — useful for math, logic, planning, or debugging tricky issues.

**Template:**
```
[Describe the problem/question].

Please think through this step by step:
1. First, [identify/list/check something relevant]
2. Then, [analyze or calculate]
3. Finally, give the conclusion/answer

Show your reasoning at each step before the final answer.
```

**Example:**
```
I have a React component that re-renders too often, causing performance issues.

Please think through this step by step:
1. First, list the common causes of unnecessary re-renders in React
2. Then, go through my code and check for each cause
3. Finally, tell me which causes apply here and how to fix them

Show your reasoning at each step before the final answer.

[paste component code]
```

---

## 6. Few-Shot Prompting (show examples, let Claude follow the pattern)
**When to use:** You want output in a very specific style/format, and it's easier to show examples than describe rules.

**Template:**
```
Follow the exact pattern shown in these examples:

Input: [example input 1]
Output: [example output 1]

Input: [example input 2]
Output: [example output 2]

Now do the same for:
Input: [your new input]
Output:
```

**Example:**
```
Follow the exact pattern shown in these examples:

Input: "the meeting got moved to thursday"
Output: "Please note that the meeting has been rescheduled to Thursday."

Input: "can u send the file pls"
Output: "Could you please send the file at your earliest convenience?"

Now do the same for:
Input: "im running late, start without me"
Output:
```

---

## 7. Writing with Specific Tone, Length & Format
**When to use:** You need written content (emails, posts, descriptions) and want to control exactly how it sounds and looks.

**Template:**
```
Write a [content type] about [topic].

Requirements:
- Tone: [e.g. friendly, formal, persuasive, casual]
- Length: [e.g. under 100 words, 2 paragraphs]
- Format: [e.g. plain text, bullet points, email with subject line]
- Audience: [who will read this]
```

**Example:**
```
Write a Slack message announcing a new feature.

Requirements:
- Tone: friendly and excited, but not over-the-top
- Length: under 60 words
- Format: plain text, suitable for a team channel
- Audience: internal product team
```

---

## 8. Role-Based Prompting (give Claude a persona/expertise)
**When to use:** You want the response shaped by a specific expertise or perspective — useful when general answers are too generic.

**Template:**
```
You are a [specific role, e.g. "senior backend engineer reviewing a junior's PR"].
[Describe the task].
When responding, focus on [what this role would care about most].
```

**Example:**
```
You are a senior backend engineer reviewing a junior developer's pull request.
Review this code for security issues, error handling, and readability.
When responding, focus on what would block this PR from being merged vs. what's a nice-to-have.

[paste code]
```

---

## 9. Comparing Options
**When to use:** You're deciding between tools, approaches, or designs and want a structured comparison.

**Template:**
```
Compare [Option A] vs [Option B] for [specific use case/context].

Present this as a table with these columns: [criteria 1], [criteria 2], [criteria 3]

After the table, give a short recommendation with reasoning.
```

**Example:**
```
Compare SQLite vs MongoDB for a small TODO app with under 1000 users.

Present this as a table with these columns: Setup complexity, Performance for small data, Scalability

After the table, give a short recommendation with reasoning.
```

---

## 10. Fixing/Improving Existing Content (without starting over)
**When to use:** You already have a draft (code, text, design) and want targeted improvements, not a full rewrite.

**Template:**
```
Here is my current [code/draft/design]:

[paste content]

Please:
1. Point out specific issues (be precise — quote the part you mean)
2. Suggest fixes for each issue
3. Don't rewrite the whole thing — only change what's necessary

What I'm trying to achieve: [your goal]
```

**Example:**
```
Here is my current product description draft:

[paste draft]

Please:
1. Point out specific issues (be precise — quote the part you mean)
2. Suggest fixes for each issue
3. Don't rewrite the whole thing — only change what's necessary

What I'm trying to achieve: sound more confident, less salesy
```

---
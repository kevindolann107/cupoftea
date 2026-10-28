// Grab the parts of the page we need
const answerBox = document.getElementById("answer");
const questionBox = document.getElementById("question");
const resultBox = document.getElementById("result");
const timerBox = document.getElementById("timer");
const timerFill = document.getElementById("timer-fill");
const roundBox = document.getElementById("round");

const SECONDS_PER_ROUND = 25;
const PAUSE_AFTER_AT_BAT = 2900; // time to watch the pitch, swing, and hit

let round = 0;
let timeLeft = 0;
let timer = null;
let locked = false;
let results = [];

// Makes "  PEDRO   martinez " match "Pedro Martinez"
function cleanUp(text) {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

// Turns distance into a baseball result
function hitType(feet) {
  if (feet >= 380) return "HOME RUN!";
  if (feet >= 300) return "Double";
  if (feet >= 200) return "Single";
  return "Weak grounder";
}

// Updates the number AND the shrinking bar
function updateTimer() {
  timerBox.textContent = timeLeft;
  timerFill.style.width = (timeLeft / SECONDS_PER_ROUND * 100) + "%";
  timerFill.style.background = timeLeft <= 5 ? "#ff4f7b" : "#7fdbff";
}

// Sets up the next prompt and starts the clock
function startRound() {
  if (round >= prompts.length) {
    endGame();
    return;
  }

  resetAtBat(); // batter back in his stance
  locked = false;
  roundBox.textContent = "AT-BAT " + (round + 1) + " OF " + prompts.length;
  questionBox.textContent = prompts[round].question;
  resultBox.textContent = "";
  resultBox.className = "";
  answerBox.value = "";
  answerBox.disabled = false;
  answerBox.focus();

  timeLeft = SECONDS_PER_ROUND;
  updateTimer();

  clearInterval(timer);
  timer = setInterval(function () {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      playStrikeout(); // pitch goes by, field shakes
      resultBox.textContent = "Time's up! Strike three.";
      finishRound({ name: "No answer", feet: 0, hit: "Strikeout" });
    }
  }, 1000);
}

// Saves the result, waits for the animation, then moves on
function finishRound(result) {
  clearInterval(timer);
  locked = true;
  answerBox.disabled = true;
  results.push(result);
  round++;
  setTimeout(startRound, PAUSE_AFTER_AT_BAT);
}

// Runs every time a key is pressed in the box
answerBox.addEventListener("keydown", function (event) {
  if (event.key !== "Enter" || locked) return;

  const guess = cleanUp(answerBox.value);
  const match = prompts[round].players.find(p => cleanUp(p.name) === guess);

  if (!match) {
    resultBox.textContent = "Not on the list. Keep swinging!";
    answerBox.value = "";
    return;
  }

  // Less famous = farther hit. Fame 100 = 100 ft, fame 0 = 450 ft
  const feet = Math.round(100 + (100 - match.fame) * 3.5);
  const hit = hitType(feet);

  playAtBat(hit, feet); // pitcher throws, batter swings, ball flies

  // Wait until the bat hits the ball before showing the result
  setTimeout(function () {
    resultBox.textContent = match.name + " — " + hit + " — " + feet + " ft";
    if (hit === "HOME RUN!") resultBox.className = "homer";
  }, 950);

  finishRound({ name: match.name, feet: feet, hit: hit });
});

// Shows the final score (the dots on the field are your spray chart)
function endGame() {
  clearInterval(timer);
  resetAtBat();
  let total = 0;
  let lines = "";
  results.forEach(function (r, i) {
    total += r.feet;
    lines += (i + 1) + ". " + r.name + " — " + r.hit + " — " + r.feet + " ft<br>";
  });

  roundBox.textContent = "FINAL";
  questionBox.textContent = total + " FT";
  document.getElementById("timer-row").style.visibility = "hidden";
  answerBox.style.display = "none";
  resultBox.className = "final"; // dark panel so the list is easy to read
  resultBox.innerHTML = lines;
}

// Play ball
startRound();
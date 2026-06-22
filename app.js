/* ==========================================================================
   FitSpark Encourage - Core Logic, AI Integration & Motivation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & MET Values ---
  const MET_VALUES = {
    running: { low: 7.0, medium: 9.8, high: 11.5 },
    weight: { low: 3.0, medium: 5.0, high: 6.0 },
    walking: { low: 2.5, medium: 3.5, high: 4.5 },
    cycling: { low: 4.0, medium: 6.0, high: 8.5 },
    swimming: { low: 5.8, medium: 8.0, high: 9.8 },
    hiit: { low: 6.0, medium: 8.5, high: 10.5 },
    yoga: { low: 2.0, medium: 3.0, high: 4.0 },
    custom: { low: 3.0, medium: 5.0, high: 7.0 }
  };

  const MOTIVATION_QUOTES = [
    { text: "持續運動的秘訣，就是踏出第一步！你的汗水絕對不會背叛你。", author: "健身大師" },
    { text: "不要因為覺得進步慢而氣餒，即使是再慢的步伐，也比躺在沙發上的你前進了許多。", author: "FitSpark" },
    { text: "羅馬不是一天造成的，但你的腹肌也是！每一天乾淨的飲食都是在塑造未來的你。", author: "運動學家" },
    { text: "今天不想動？那就只動10分鐘吧！往往最難的是換上運動鞋的那一刻。", author: "阿諾·史瓦辛格" },
    { text: "身材是維持健康和美麗的副作用。專注於變強壯，美好的體態自然會隨之而來。", author: "健康管理師" },
    { text: "吃下的每一口健康食物，都是在向你想要的身體投票。", author: "營養學家" },
    { text: "不要在最需要努力的年紀，選擇了安逸。動起來，流汗是脂肪的眼淚！", author: "激勵大師" },
    { text: "力量不是來自於你能做什麼，而是來自於克服你曾經認為做不到的事。", author: "林書豪" },
    { text: "偉大的成果不是靠力量，而是靠堅持來實現的。未來的你，一定會感謝現在努力的自己！", author: "塞繆爾·約翰遜" },
    { text: "你的身體是你的神殿，你要保護它，並且讓它強大，這是一輩子的事業。", author: "古希臘哲學" }
  ];

  // --- Application State ---
  let state = {
    profile: {
      gender: 'male',
      age: 28,
      height: 175,
      weight: 70,
      muscle: 30,
      fatPercent: 20,
      activity: 1.2,
      restDays: 2,
      targetCalories: 2000,
      targetProtein: 120,
      targetCarbs: 220,
      targetFat: 60,
      geminiApiKey: '',
      sheetsUrl: 'https://script.google.com/macros/s/AKfycbwXBXuAWhKEXLtefZ4DCpBSPwbjRL5b8JF6dcFKeJ8dkdRdvf56gNnQDnWUporcRCtW/exec'
    },
    dailyLogs: {} // Key: YYYY-MM-DD, Value: { workouts: [], diet: [] }
  };

  // --- Current Selected Date ---
  let currentActiveDate = getTodayDateString();

  // --- Cache DOM Elements ---
  const el = {
    // Navigation & Global
    clock: document.getElementById('live-clock'),
    appLoader: document.getElementById('app-loader'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    syncSheetsBtn: document.getElementById('btn-sync-sheets'),
    settingsBtn: document.getElementById('btn-settings'),
    
    // Dashboard & Summary
    dashboardDate: document.getElementById('dashboard-date'),
    netCalVal: document.getElementById('net-cal-val'),
    totalCalIn: document.getElementById('total-cal-in'),
    totalCalOut: document.getElementById('total-cal-out'),
    tdeeDisplay: document.getElementById('tdee-val-display'),
    ringProgressIn: document.getElementById('ring-progress-in'),
    ringProgressOut: document.getElementById('ring-progress-out'),
    
    // Macros
    macroProteinRatio: document.getElementById('macro-protein-ratio'),
    macroCarbRatio: document.getElementById('macro-carb-ratio'),
    macroFatRatio: document.getElementById('macro-fat-ratio'),
    macroProteinBar: document.getElementById('macro-protein-bar'),
    macroCarbBar: document.getElementById('macro-carb-bar'),
    macroFatBar: document.getElementById('macro-fat-bar'),
    
    // Projections
    proj7Weight: document.getElementById('proj-7-weight'),
    proj7Muscle: document.getElementById('proj-7-muscle'),
    proj7Fat: document.getElementById('proj-7-fat'),
    proj30Weight: document.getElementById('proj-30-weight'),
    proj30Muscle: document.getElementById('proj-30-muscle'),
    proj30Fat: document.getElementById('proj-30-fat'),
    
    // Motivation
    motivateQuoteText: document.getElementById('motivate-quote-text'),
    motivateQuoteAuthor: document.getElementById('motivate-quote-author'),
    btnGetSpark: document.getElementById('btn-get-spark'),
    btnSpeakQuote: document.getElementById('btn-speak-quote'),
    
    // Workouts Panel
    formWorkout: document.getElementById('form-add-workout'),
    workoutType: document.getElementById('workout-type'),
    customWorkoutNameGroup: document.getElementById('custom-workout-name-group'),
    workoutCustomName: document.getElementById('workout-custom-name'),
    workoutDuration: document.getElementById('workout-duration'),
    workoutIntensity: document.getElementById('workout-intensity'),
    workoutCaloriesOverride: document.getElementById('workout-calories-override'),
    calculatedCalPreview: document.getElementById('calculated-calories-preview'),
    workoutListCount: document.getElementById('workout-list-count'),
    workoutList: document.getElementById('workout-list'),
    
    // AI Workout Estimator Panel
    aiWorkoutPromptInput: document.getElementById('ai-workout-prompt-input'),
    btnAiWorkoutEstimate: document.getElementById('btn-ai-workout-estimate'),
    btnClearWorkoutAi: document.getElementById('btn-clear-workout-ai'),
    aiWorkoutResultPanel: document.getElementById('ai-workout-result-panel'),
    aiWorkoutStatusIndicator: document.getElementById('ai-workout-status-indicator'),
    aiWorkoutResultTbody: document.getElementById('ai-workout-result-tbody'),
    btnAiWorkoutAccept: document.getElementById('btn-ai-workout-accept'),
    btnAiWorkoutReject: document.getElementById('btn-ai-workout-reject'),
    
    // Diet Panel
    aiPromptInput: document.getElementById('ai-prompt-input'),
    btnAiEstimate: document.getElementById('btn-ai-estimate'),
    btnClearAi: document.getElementById('btn-clear-ai'),
    aiResultPanel: document.getElementById('ai-result-panel'),
    aiStatusIndicator: document.getElementById('ai-status-indicator'),
    aiResultTbody: document.getElementById('ai-result-tbody'),
    btnAiAccept: document.getElementById('btn-ai-accept'),
    btnAiReject: document.getElementById('btn-ai-reject'),
    
    formFood: document.getElementById('form-add-food'),
    foodName: document.getElementById('food-name'),
    foodCalories: document.getElementById('food-calories'),
    foodProtein: document.getElementById('food-protein'),
    foodCarbs: document.getElementById('food-carbs'),
    foodFat: document.getElementById('food-fat'),
    dietListCount: document.getElementById('diet-list-count'),
    dietList: document.getElementById('diet-list'),
    
    // Body Profile Tab Display
    profileBmrDisplay: document.getElementById('profile-bmr-display'),
    profileTdeeDisplay: document.getElementById('profile-tdee-display'),
    summaryGender: document.getElementById('summary-gender'),
    summaryAge: document.getElementById('summary-age'),
    summaryHeight: document.getElementById('summary-height'),
    summaryWeight: document.getElementById('summary-weight'),
    summaryMuscle: document.getElementById('summary-muscle'),
    summaryFatPercent: document.getElementById('summary-fat-percent'),
    summaryActivity: document.getElementById('summary-activity'),
    summaryRestDays: document.getElementById('summary-rest-days'),
    btnEditProfileTab: document.getElementById('btn-edit-profile-tab'),
    currentDailyDeficit: document.getElementById('current-daily-deficit'),
    proteinTargetStatus: document.getElementById('protein-target-status'),
    
    // Settings Modal Inputs
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingsForm: document.getElementById('settings-form'),
    inputGender: document.getElementById('input-gender'),
    inputAge: document.getElementById('input-age'),
    inputHeight: document.getElementById('input-height'),
    inputWeight: document.getElementById('input-weight'),
    inputMuscle: document.getElementById('input-muscle'),
    inputFatPercent: document.getElementById('input-fat-percent'),
    inputActivity: document.getElementById('input-activity'),
    inputRestDays: document.getElementById('input-rest-days'),
    targetCalories: document.getElementById('target-calories'),
    targetProtein: document.getElementById('target-protein'),
    targetCarbs: document.getElementById('target-carbs'),
    targetFat: document.getElementById('target-fat'),
    inputSheetUrl: document.getElementById('input-sheet-url'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    
    // Favorite Chips
    favoriteWorkoutChips: document.getElementById('favorite-workout-chips'),
    favoriteDietChips: document.getElementById('favorite-diet-chips'),

    // Confetti Canvas
    confettiCanvas: document.getElementById('confetti-canvas'),
    toastContainer: document.getElementById('toast-container')
  };

  // Temporary container for AI estimated food items
  let currentAiEstimatedItems = [];
  // Temporary container for AI estimated workouts
  let currentAiEstimatedWorkouts = [];

  // --- Clock Logic ---
  function startClock() {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      el.clock.textContent = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // --- Utility functions ---
  function getTodayDateString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function getActiveLog() {
    if (!state.dailyLogs[currentActiveDate]) {
      state.dailyLogs[currentActiveDate] = { workouts: [], diet: [] };
    }
    return state.dailyLogs[currentActiveDate];
  }

  // --- JSONP Request Helper to bypass CORS in file:// protocol ---
  function jsonpRequest(url, params, callbackName) {
    return new Promise((resolve, reject) => {
      const uniqueCallback = callbackName + '_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      
      // Register callback globally
      window[uniqueCallback] = (data) => {
        resolve(data);
        cleanup();
      };
      
      const queryParams = { ...params, callback: uniqueCallback };
      const queryString = Object.keys(queryParams)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key]))
        .join('&');
      
      const script = document.createElement('script');
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + queryString;
      script.async = true;
      
      script.onerror = () => {
        reject(new Error('JSONP 請求連線失敗，請檢查網路或 Apps Script 網址設定。'));
        cleanup();
      };
      
      document.body.appendChild(script);
      
      function cleanup() {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete window[uniqueCallback];
      }
    });
  }

  // --- Storage Logic ---
  function saveStateToStorage() {
    localStorage.setItem('fitspark_state', JSON.stringify(state));
  }

  function loadStateFromStorage() {
    const stored = localStorage.getItem('fitspark_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.profile) state.profile = { ...state.profile, ...parsed.profile };
        if (parsed.dailyLogs) state.dailyLogs = parsed.dailyLogs;
      } catch (err) {
        console.error('Error parsing stored FitSpark state:', err);
      }
    }
    
    // Fallback sheetsUrl if empty in stored profile
    if (!state.profile.sheetsUrl) {
      state.profile.sheetsUrl = 'https://script.google.com/macros/s/AKfycbwXBXuAWhKEXLtefZ4DCpBSPwbjRL5b8JF6dcFKeJ8dkdRdvf56gNnQDnWUporcRCtW/exec';
    }

    // Initialize default favorites if not present
    if (!state.profile.favoriteWorkouts) {
      state.profile.favoriteWorkouts = [
        { type: 'weight', name: '常規重量訓練', duration: 45, intensity: 'medium', calories: 225 },
        { type: 'running', name: '有氧慢跑', duration: 30, intensity: 'medium', calories: 343 },
        { type: 'walking', name: '休閒散步', duration: 40, intensity: 'medium', calories: 163 }
      ];
    }
    if (!state.profile.favoriteDiet) {
      state.profile.favoriteDiet = [
        { name: '茶葉蛋 (2顆)', calories: 150, protein: 12.6, carbs: 1.2, fat: 10 },
        { name: '無糖豆漿 (400ml)', calories: 130, protein: 13, carbs: 4.8, fat: 6.5 },
        { name: '烤雞腿便當 (1個)', calories: 820, protein: 32, carbs: 95, fat: 32 }
      ];
    }
    
    // Initialize date logs if empty
    getActiveLog();
  }

  // --- Mifflin-St Jeor TDEE Formulas ---
  function calculateBmr() {
    const p = state.profile;
    const weight = parseFloat(p.weight) || 70;
    const height = parseFloat(p.height) || 175;
    const age = parseInt(p.age) || 28;
    
    if (p.gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  function calculateTdee() {
    const bmr = calculateBmr();
    const factor = parseFloat(state.profile.activity) || 1.2;
    return Math.round(bmr * factor);
  }

  // --- Exercise Calories Calculator ---
  function updateMetPreview() {
    const duration = parseFloat(el.workoutDuration.value) || 0;
    const type = el.workoutType.value;
    const intensity = el.workoutIntensity.value;
    const weight = parseFloat(state.profile.weight) || 70;
    
    let met = 5.0; // Default
    if (MET_VALUES[type] && MET_VALUES[type][intensity]) {
      met = MET_VALUES[type][intensity];
    }
    
    // Formula: MET * weight_kg * (duration_mins / 60)
    const cal = Math.round(met * weight * (duration / 60));
    el.calculatedCalPreview.textContent = cal;
    
    // If override isn't focused/manually set, suggest this value
    if (document.activeElement !== el.workoutCaloriesOverride && !el.workoutCaloriesOverride.value) {
      el.workoutCaloriesOverride.placeholder = cal;
    }
  }

  // --- Body Projections Engine ---
  function updateProjections() {
    const p = state.profile;
    const currentWeight = parseFloat(p.weight) || 70;
    const currentMuscle = parseFloat(p.muscle) || 30;
    const currentFatPct = parseFloat(p.fatPercent) || 20;
    const tdee = calculateTdee();
    const restDays = parseInt(p.restDays) || 0;
    const trainingDays = Math.max(0, 7 - restDays);
    
    // Calculate current day's totals
    const log = getActiveLog();
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const workoutOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    
    // Account for rest days in weekly deficit
    // Workout burn only happens on training days (7 - restDays)
    const avgDailyWorkoutOut = (workoutOut * trainingDays) / 7;
    const totalOut = tdee + workoutOut;
    const netDeficit = totalOut - totalIn; // Calories Out > Calories In is a positive deficit
    
    // Protein target status (sufficient protein defined as >= 80% of target)
    const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
    const targetProtein = parseFloat(p.targetProtein) || 120;
    const hasEnoughProtein = totalProtein >= (targetProtein * 0.8);
    
    // Weight training check (>= 30 minutes of strength training)
    const weightTrainingMins = log.workouts
      .filter(w => w.type === 'weight' || w.name.toLowerCase().includes('重訓') || w.name.toLowerCase().includes('重量'))
      .reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
    const hasWeightTraining = weightTrainingMins >= 30;
    
    // Average weekly daily balance (intake - total output)
    const avgDailyBalance = totalIn - (tdee + avgDailyWorkoutOut);
    
    // 7 Days Calculations
    const change7Weight = (avgDailyBalance * 7) / 7700; // 7,700 kcal = 1kg body weight
    let gain7Muscle = 0;
    
    if (avgDailyBalance < 0 && !hasEnoughProtein) {
      // "光靠節食會掉肌肉" - Dieting alone with low protein drops muscle (est. 35% of weight loss is muscle)
      gain7Muscle = change7Weight * 0.35;
    } else if (hasEnoughProtein) {
      if (hasWeightTraining) {
        // High protein + Weight training: weight training days build muscle (1.0 coeff), rest days build minor muscle (0.25 coeff)
        const avgMuscleGrowthCoeff = (trainingDays * 1.0 + restDays * 0.25) / 7;
        gain7Muscle = 0.15 * avgMuscleGrowthCoeff;
      } else {
        // High protein but NO weight training: muscle growth coefficient drops to 0.25
        gain7Muscle = 0.15 * 0.25;
      }
    } else {
      // Surplus or neutral with low protein, or other scenarios: 0 muscle growth
      gain7Muscle = 0;
    }
    
    const change7Fat = change7Weight - gain7Muscle; // fat change = weight change - muscle change
    
    const future7Weight = Math.max(30, currentWeight + change7Weight);
    const future7Muscle = Math.max(10, currentMuscle + gain7Muscle);
    
    const currentFatMass = currentWeight * (currentFatPct / 100);
    const future7FatMass = Math.max(1, currentFatMass + change7Fat);
    const future7FatPct = Math.max(1, Math.min(99, (future7FatMass / future7Weight) * 100));
    
    // 30 Days Calculations
    const change30Weight = (avgDailyBalance * 30) / 7700;
    let gain30Muscle = 0;
    
    if (avgDailyBalance < 0 && !hasEnoughProtein) {
      // Low protein deficit drops muscle
      gain30Muscle = change30Weight * 0.35;
    } else if (hasEnoughProtein) {
      if (hasWeightTraining) {
        const avgMuscleGrowthCoeff = (trainingDays * 1.0 + restDays * 0.25) / 7;
        gain30Muscle = 0.6 * avgMuscleGrowthCoeff;
      } else {
        gain30Muscle = 0.6 * 0.25;
      }
    } else {
      gain30Muscle = 0;
    }
    
    const change30Fat = change30Weight - gain30Muscle;
    
    const future30Weight = Math.max(30, currentWeight + change30Weight);
    const future30Muscle = Math.max(10, currentMuscle + gain30Muscle);
    const future30FatMass = Math.max(1, currentFatMass + change30Fat);
    const future30FatPct = Math.max(1, Math.min(99, (future30FatMass / future30Weight) * 100));
    
    // Update Dashboard UI with deltas
    formatProjText(el.proj7Weight, change7Weight, 'weight', future7Weight, 'kg', currentWeight);
    formatProjText(el.proj7Muscle, gain7Muscle, 'muscle', future7Muscle, 'kg', currentMuscle);
    formatProjText(el.proj7Fat, future7FatPct - currentFatPct, 'fat', future7FatPct, '%', currentFatPct);
    
    formatProjText(el.proj30Weight, change30Weight, 'weight', future30Weight, 'kg', currentWeight);
    formatProjText(el.proj30Muscle, gain30Muscle, 'muscle', future30Muscle, 'kg', currentMuscle);
    formatProjText(el.proj30Fat, future30FatPct - currentFatPct, 'fat', future30FatPct, '%', currentFatPct);
    
    // Update Body Tab Detailed statistics
    el.currentDailyDeficit.textContent = `${Math.round(netDeficit)} kcal`;
    if (netDeficit > 0) {
      el.currentDailyDeficit.style.color = 'var(--accent-green)';
    } else {
      el.currentDailyDeficit.style.color = '#ef4444';
    }
    
    el.proteinTargetStatus.textContent = `${totalProtein.toFixed(1)}g / ${targetProtein}g (${hasEnoughProtein ? '已達標' : '未達標'})`;
    el.proteinTargetStatus.style.color = hasEnoughProtein ? 'var(--accent-green)' : 'var(--accent-yellow)';
  }

  function formatProjText(element, changeValue, metricType, futureValue, unit, currentValue) {
    let color = 'white';
    let arrow = '';
    
    if (metricType === 'weight' || metricType === 'fat') {
      // Weight & fat reduction are healthy/positive (green), increase is negative (red)
      if (changeValue < -0.01) {
        color = 'var(--accent-green)';
        arrow = ' ↓';
      } else if (changeValue > 0.01) {
        color = '#ef4444';
        arrow = ' ↑';
      }
    } else if (metricType === 'muscle') {
      // Muscle gain is positive (purple), loss is negative (red)
      if (changeValue > 0.01) {
        color = 'var(--accent-purple)';
        arrow = ' ↑';
      } else if (changeValue < -0.01) {
        color = '#ef4444';
        arrow = ' ↓';
      }
    }
    
    const isPct = unit === '%';
    const spacing = isPct ? '' : ' ';
    const futureStr = futureValue.toFixed(metricType === 'fat' ? 1 : 2);
    const changeStr = changeValue >= 0 
      ? `+${changeValue.toFixed(metricType === 'fat' ? 1 : 2)}` 
      : `${changeValue.toFixed(metricType === 'fat' ? 1 : 2)}`;
      
    element.style.color = color;
    if (currentValue !== undefined) {
      const currentStr = currentValue.toFixed(metricType === 'fat' ? 1 : 2);
      element.innerHTML = `
        ${futureStr}${spacing}${unit}${arrow}
        <div class="proj-delta" style="font-size: 10px; font-weight: 500; opacity: 0.8; margin-top: 3px; white-space: nowrap;">
          現 ${currentStr}${unit} (${changeStr}${spacing}${unit})
        </div>
      `;
    } else {
      element.innerHTML = `${futureStr}${spacing}${unit} <span class="proj-delta" style="font-size: 11px; font-weight: 500; opacity: 0.85;">(${changeStr}${spacing}${unit})</span>${arrow}`;
    }
  }

  // --- UI Update Pipeline ---
  function updateUI() {
    const log = getActiveLog();
    const p = state.profile;
    
    // 1. Clock and Date displays
    const dateObj = new Date(currentActiveDate + 'T00:00:00');
    el.dashboardDate.textContent = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    
    // 2. TDEE Calculations
    const tdee = calculateTdee();
    el.tdeeDisplay.textContent = `${tdee} kcal`;
    el.profileTdeeDisplay.textContent = `${tdee} kcal`;
    el.profileBmrDisplay.textContent = `${Math.round(calculateBmr())} kcal`;
    
    // 3. Calorie Ring Totals
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const totalOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const netCalories = totalIn - (tdee + totalOut);
    
    el.totalCalIn.textContent = `${Math.round(totalIn)} kcal`;
    el.totalCalOut.textContent = `${Math.round(tdee + totalOut)} kcal`;
    el.netCalVal.textContent = Math.round(netCalories);
    
    // Color code Net Calorie text based on deficit/surplus
    if (netCalories < 0) {
      el.netCalVal.style.color = 'var(--accent-green)';
    } else if (netCalories > 0) {
      el.netCalVal.style.color = '#ef4444';
    } else {
      el.netCalVal.style.color = 'white';
    }
    
    // Animate SVG Calorie rings
    // Target Intake Progress (Outer ring, r=50, circumference = 314)
    const targetIn = parseFloat(p.targetCalories) || 2000;
    const progressInPercent = Math.min(1.2, totalIn / targetIn);
    const offsetIn = 314 - (314 * progressInPercent);
    el.ringProgressIn.style.strokeDashoffset = offsetIn;
    
    // Workout Burn Progress (Inner ring, r=42, circumference = 264)
    // We assume standard active burn target of 400 kcal
    const targetActiveOut = 400;
    const progressOutPercent = Math.min(1.2, totalOut / targetActiveOut);
    const offsetOut = 264 - (264 * progressOutPercent);
    el.ringProgressOut.style.strokeDashoffset = offsetOut;
    
    // 4. Macro progress bars
    const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
    const totalCarbs = log.diet.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0);
    const totalFat = log.diet.reduce((sum, item) => sum + (parseFloat(item.fat) || 0), 0);
    
    const targetProtein = parseFloat(p.targetProtein) || 120;
    const targetCarbs = parseFloat(p.targetCarbs) || 220;
    const targetFat = parseFloat(p.targetFat) || 60;
    
    el.macroProteinRatio.textContent = `${totalProtein.toFixed(1)}g / ${targetProtein}g`;
    el.macroCarbRatio.textContent = `${totalCarbs.toFixed(1)}g / ${targetCarbs}g`;
    el.macroFatRatio.textContent = `${totalFat.toFixed(1)}g / ${targetFat}g`;
    
    el.macroProteinBar.style.width = `${Math.min(100, (totalProtein / targetProtein) * 100)}%`;
    el.macroCarbBar.style.width = `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%`;
    el.macroFatBar.style.width = `${Math.min(100, (totalFat / targetFat) * 100)}%`;
    
    // 5. Workouts list
    const totalExerciseMins = log.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
    el.workoutListCount.textContent = `今日累計運動 ${log.workouts.length} 項，共 ${totalExerciseMins} 分鐘`;
    
    if (log.workouts.length === 0) {
      el.workoutList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧘‍♂️</div>
          <p>今天還沒有運動記錄喔！<br>動起來，為今天加分！</p>
        </div>`;
    } else {
      el.workoutList.innerHTML = log.workouts.map(w => {
        const isFav = (state.profile.favoriteWorkouts || []).some(fav => 
          fav.type === w.type && fav.name === w.name && fav.duration === w.duration && fav.calories === w.calories
        );
        return `
          <div class="list-item" data-id="${w.id}">
            <div class="item-meta">
              <span class="item-title">${getWorkoutDisplayName(w.type, w.name)}</span>
              <span class="item-subtitle">${w.duration} 分鐘 &bull; 強度: ${getIntensityDisplayName(w.intensity)}</span>
            </div>
            <div class="item-right">
              <span class="item-value" style="color: var(--accent-orange);">${w.calories} kcal</span>
              <button class="btn-fav-item ${isFav ? 'is-fav' : ''}" onclick="toggleFavoriteWorkout('${w.id}')" title="${isFav ? '從常用中移除' : '加入常用'}">
                <svg width="16" height="16" viewBox="0 0 24 24" ${isFav ? 'fill="currentColor"' : 'fill="none"'} stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <button class="btn-delete-item" onclick="deleteWorkout('${w.id}')" title="刪除此紀錄">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // 6. Diet list
    el.dietListCount.textContent = `今日累計攝取 ${log.diet.length} 項，共 ${Math.round(totalIn)} kcal`;
    
    if (log.diet.length === 0) {
      el.dietList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍳</div>
          <p>今天還沒有飲食記錄喔！<br>快使用 AI 或手動記錄下您吃的美食！</p>
        </div>`;
    } else {
      el.dietList.innerHTML = log.diet.map(f => {
        const isFav = (state.profile.favoriteDiet || []).some(fav => 
          fav.name === f.name && fav.calories === f.calories && fav.protein === f.protein && fav.carbs === f.carbs && fav.fat === f.fat
        );
        return `
          <div class="list-item" data-id="${f.id}">
            <div class="item-meta">
              <span class="item-title">${f.name}</span>
              <span class="item-subtitle">蛋: ${f.protein}g &bull; 碳: ${f.carbs}g &bull; 脂: ${f.fat}g</span>
            </div>
            <div class="item-right">
              <span class="item-value" style="color: var(--accent-green);">${f.calories} kcal</span>
              <button class="btn-fav-item ${isFav ? 'is-fav' : ''}" onclick="toggleFavoriteDiet('${f.id}')" title="${isFav ? '從常用中移除' : '加入常用'}">
                <svg width="16" height="16" viewBox="0 0 24 24" ${isFav ? 'fill="currentColor"' : 'fill="none"'} stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <button class="btn-delete-item" onclick="deleteFood('${f.id}')" title="刪除此紀錄">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // 7. Profile summary tab
    el.summaryGender.textContent = p.gender === 'male' ? '男性 (Male)' : '女性 (Female)';
    el.summaryAge.textContent = `${p.age} 歲`;
    el.summaryHeight.textContent = `${p.height} cm`;
    el.summaryWeight.textContent = `${p.weight} kg`;
    el.summaryMuscle.textContent = `${p.muscle} kg`;
    el.summaryFatPercent.textContent = `${p.fatPercent} %`;
    el.summaryActivity.textContent = getActivityDisplayName(p.activity);
    el.summaryRestDays.textContent = `${p.restDays !== undefined ? p.restDays : 2} 天`;
    
    // 8. Run calculations to update forecasts
    updateProjections();

    // 9. Update Favorite lists
    updateFavoriteWorkoutsUI();
    updateFavoriteDietUI();
  }

  function updateFavoriteWorkoutsUI() {
    const list = state.profile.favoriteWorkouts || [];
    if (!el.favoriteWorkoutChips) return;
    if (list.length === 0) {
      el.favoriteWorkoutChips.innerHTML = `<span class="form-help">尚無常用運動。可在今日運動清單中點擊 ★ 加入常用！</span>`;
      return;
    }
    el.favoriteWorkoutChips.innerHTML = list.map((w, idx) => `
      <div class="fav-item-chip workout-chip" onclick="addFavoriteWorkoutToToday(${idx})" title="點擊直接登錄今日">
        <span class="chip-name">${getWorkoutDisplayName(w.type, w.name)}</span>
        <span class="chip-meta">${w.duration}分鐘 &bull; ${w.calories}kcal</span>
      </div>
    `).join('');
  }

  function updateFavoriteDietUI() {
    const list = state.profile.favoriteDiet || [];
    if (!el.favoriteDietChips) return;
    if (list.length === 0) {
      el.favoriteDietChips.innerHTML = `<span class="form-help">尚無常用飲食。可在今日飲食清單中點擊 ★ 加入常用！</span>`;
      return;
    }
    el.favoriteDietChips.innerHTML = list.map((f, idx) => `
      <div class="fav-item-chip diet-chip" onclick="addFavoriteDietToToday(${idx})" title="點擊直接登錄今日">
        <span class="chip-name" title="${f.name}">${f.name}</span>
        <span class="chip-meta">${f.calories}kcal &bull; 蛋:${f.protein}g</span>
      </div>
    `).join('');
  }

  window.toggleFavoriteWorkout = (id) => {
    const log = getActiveLog();
    const item = log.workouts.find(w => w.id === id);
    if (!item) return;
    
    if (!state.profile.favoriteWorkouts) state.profile.favoriteWorkouts = [];
    
    const matchIdx = state.profile.favoriteWorkouts.findIndex(w => 
      w.type === item.type && w.name === item.name && w.duration === item.duration && w.calories === item.calories
    );
    
    if (matchIdx >= 0) {
      state.profile.favoriteWorkouts.splice(matchIdx, 1);
      showToast('已從常用運動中移除。', 'info');
    } else {
      state.profile.favoriteWorkouts.push({
        type: item.type,
        name: item.name,
        duration: item.duration,
        intensity: item.intensity,
        calories: item.calories
      });
      showToast('已加入常用運動！下次可一鍵快速登錄。', 'success');
    }
    
    saveStateToStorage();
    updateUI();
  };

  window.toggleFavoriteDiet = (id) => {
    const log = getActiveLog();
    const item = log.diet.find(f => f.id === id);
    if (!item) return;
    
    if (!state.profile.favoriteDiet) state.profile.favoriteDiet = [];
    
    const matchIdx = state.profile.favoriteDiet.findIndex(f => 
      f.name === item.name && f.calories === item.calories && f.protein === item.protein && f.carbs === item.carbs && f.fat === item.fat
    );
    
    if (matchIdx >= 0) {
      state.profile.favoriteDiet.splice(matchIdx, 1);
      showToast('已從常用飲食中移除。', 'info');
    } else {
      state.profile.favoriteDiet.push({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      });
      showToast('已加入常用飲食！下次可一鍵快速登錄。', 'success');
    }
    
    saveStateToStorage();
    updateUI();
  };

  window.addFavoriteWorkoutToToday = (index) => {
    const w = state.profile.favoriteWorkouts[index];
    if (!w) return;
    
    const newWorkout = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: w.type,
      name: w.name,
      duration: w.duration,
      intensity: w.intensity || 'medium',
      calories: w.calories
    };
    
    const log = getActiveLog();
    log.workouts.push(newWorkout);
    saveStateToStorage();
    updateUI();
    showToast(`已直接登錄常用運動：${getWorkoutDisplayName(w.type, w.name)}！`, 'success');
    triggerConfetti();
  };

  window.addFavoriteDietToToday = (index) => {
    const f = state.profile.favoriteDiet[index];
    if (!f) return;
    
    const newFood = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat
    };
    
    const log = getActiveLog();
    log.diet.push(newFood);
    saveStateToStorage();
    updateUI();
    showToast(`已直接登錄常用飲食：${f.name}！`, 'success');
    triggerConfetti();
  };

  function getWorkoutDisplayName(type, customName) {
    if (type === 'custom') return customName || '自訂運動';
    const names = {
      running: '慢跑 / 跑步',
      weight: '重量訓練 / 重訓',
      walking: '走路 / 散步',
      cycling: '騎單車 / 自行車',
      swimming: '游泳',
      hiit: '高強度間歇訓練 (HIIT)',
      yoga: '瑜珈'
    };
    return names[type] || '運動';
  }

  function getIntensityDisplayName(intensity) {
    const names = { low: '低強度', medium: '中強度', high: '高強度' };
    return names[intensity] || '中強度';
  }

  function getActivityDisplayName(val) {
    const activityMap = {
      '1.2': '久坐族 (辦公室/不運動)',
      '1.375': '輕度活動 (每週運動1-3天)',
      '1.55': '中度活動 (每週運動3-5天)',
      '1.725': '重度活動 (每週運動6-7天)',
      '1.9': '極重度活動 (每日劇烈運動/勞動)'
    };
    return activityMap[String(val)] || '久坐族';
  }

  // --- Dynamic MET Update event listeners ---
  el.workoutDuration.addEventListener('input', updateMetPreview);
  el.workoutType.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      el.customWorkoutNameGroup.classList.remove('hidden');
      el.workoutCustomName.required = true;
    } else {
      el.customWorkoutNameGroup.classList.add('hidden');
      el.workoutCustomName.required = false;
    }
    updateMetPreview();
  });
  el.workoutIntensity.addEventListener('change', updateMetPreview);

  // --- Workout Action Handlers ---
  el.formWorkout.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const type = el.workoutType.value;
    const name = type === 'custom' ? el.workoutCustomName.value : '';
    const duration = parseInt(el.workoutDuration.value);
    const intensity = el.workoutIntensity.value;
    
    let calories = parseInt(el.workoutCaloriesOverride.value);
    if (isNaN(calories) || calories === null || calories < 0) {
      calories = parseInt(el.calculatedCalPreview.textContent);
    }
    
    const newWorkout = {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      name,
      duration,
      intensity,
      calories
    };
    
    const log = getActiveLog();
    log.workouts.push(newWorkout);
    saveStateToStorage();
    updateUI();
    
    // Reset form
    el.formWorkout.reset();
    el.customWorkoutNameGroup.classList.add('hidden');
    el.workoutCustomName.required = false;
    el.calculatedCalPreview.textContent = '0';
    el.workoutCaloriesOverride.placeholder = '自動計算中';
    
    showToast('成功加入一筆運動記錄！加油！', 'success');
    triggerConfetti();
  });

  // Attach global functions to window so list onclick bindings work
  window.deleteWorkout = (id) => {
    const log = getActiveLog();
    log.workouts = log.workouts.filter(w => w.id !== id);
    saveStateToStorage();
    updateUI();
    showToast('運動記錄已刪除。', 'info');
  };

  // --- Food Action Handlers ---
  el.formFood.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = el.foodName.value;
    const calories = parseInt(el.foodCalories.value);
    const protein = parseFloat(el.foodProtein.value);
    const carbs = parseFloat(el.foodCarbs.value);
    const fat = parseFloat(el.foodFat.value);
    
    const newFood = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name,
      calories,
      protein,
      carbs,
      fat
    };
    
    const log = getActiveLog();
    log.diet.push(newFood);
    saveStateToStorage();
    updateUI();
    
    // Reset form
    el.formFood.reset();
    showToast('飲食記錄已登錄！', 'success');
  });

  window.deleteFood = (id) => {
    const log = getActiveLog();
    log.diet = log.diet.filter(f => f.id !== id);
    saveStateToStorage();
    updateUI();
    showToast('飲食記錄已刪除。', 'info');
  };

  // --- AI Estimator Engine (Gemini API Integration via GAS Proxy) ---
  el.btnAiEstimate.addEventListener('click', async () => {
    const promptText = el.aiPromptInput.value.trim();
    if (!promptText) {
      showToast('請先輸入您吃了些什麼！', 'info');
      return;
    }
    
    el.btnAiEstimate.disabled = true;
    el.btnAiEstimate.querySelector('span').textContent = 'AI 分析中...';
    
    const sheetsUrl = state.profile.sheetsUrl;
    
    if (!sheetsUrl) {
      showToast('使用 AI 估算前，請先於右上角設定中填寫您的 Google Apps Script 同步網址以做為代理通道！', 'info');
      el.settingsModal.classList.add('active');
      el.btnAiEstimate.disabled = false;
      el.btnAiEstimate.querySelector('span').textContent = 'AI 估算熱量與營養';
      return;
    }

    try {
      // Call Gemini parser via the Google Apps Script Web App proxy using JSONP to bypass CORS on file:// protocol
      const resData = await jsonpRequest(sheetsUrl, {
        action: 'estimateFood',
        text: promptText
      }, 'cb_food');
      
      if (resData.result === 'success' && Array.isArray(resData.data)) {
        displayAiResults(resData.data);
      } else {
        throw new Error(resData.message || 'AI 估算回傳格式不正確');
      }
    } catch (err) {
      console.error('Gemini estimate via GAS error:', err);
      showToast('AI 估算連線失敗，改用本地智慧估算引擎模擬。', 'error');
      await simulateAiEstimation(promptText);
    }
    
    el.btnAiEstimate.disabled = false;
    el.btnAiEstimate.querySelector('span').textContent = 'AI 估算熱量與營養';
  });

  // Common food database for local smart simulator
  const MOCK_FOOD_DB = [
    { keywords: ['雞肉', '雞胸'], name: '舒肥雞胸肉 (100g)', calories: 120, protein: 23, carbs: 0, fat: 2.5 },
    { keywords: ['排骨', '排骨飯', '排骨便當'], name: '排骨便當 (1個)', calories: 750, protein: 28, carbs: 90, fat: 30 },
    { keywords: ['雞腿', '雞腿飯', '雞腿便當'], name: '烤雞腿便當 (1個)', calories: 820, protein: 32, carbs: 95, fat: 32 },
    { keywords: ['牛肉麵'], name: '紅燒牛肉麵 (1碗)', calories: 650, protein: 26, carbs: 75, fat: 22 },
    { keywords: ['茶葉蛋', '蛋', '雞蛋'], name: '茶葉蛋 (1顆)', calories: 75, protein: 6.3, carbs: 0.6, fat: 5.0 },
    { keywords: ['牛奶', '鮮奶'], name: '低脂鮮乳 (290ml)', calories: 120, protein: 9, carbs: 14, fat: 3.5 },
    { keywords: ['蘋果'], name: '蘋果 (1個)', calories: 60, protein: 0.3, carbs: 15, fat: 0.2 },
    { keywords: ['香蕉'], name: '香蕉 (1根)', calories: 95, protein: 1.1, carbs: 23, fat: 0.3 },
    { keywords: ['沙拉'], name: '雞肉凱薩沙拉 (1份)', calories: 250, protein: 12, carbs: 15, fat: 16 },
    { keywords: ['貢丸湯'], name: '貢丸湯 (1碗)', calories: 150, protein: 8, carbs: 5, fat: 11 },
    { keywords: ['綠茶', '烏龍茶', '紅茶'], name: '無糖茶飲料 (500ml)', calories: 0, protein: 0, carbs: 0, fat: 0 },
    { keywords: ['豆漿'], name: '無糖豆漿 (400ml)', calories: 130, protein: 13, carbs: 4.8, fat: 6.5 },
    { keywords: ['地瓜'], name: '蒸地瓜 (100g)', calories: 115, protein: 1.2, carbs: 28, fat: 0.2 },
    { keywords: ['火鍋'], name: '個人涮涮鍋 (1份)', calories: 800, protein: 35, carbs: 80, fat: 38 }
  ];

  async function simulateAiEstimation(promptText) {
    // Artificial 1.5s delay to look nice
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const results = [];
    const lowerText = promptText.toLowerCase();
    
    // Search words in description
    MOCK_FOOD_DB.forEach(food => {
      let matched = false;
      food.keywords.forEach(kw => {
        if (lowerText.includes(kw)) matched = true;
      });
      
      if (matched) {
        results.push({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        });
      }
    });
    
    // Fallback if nothing matches
    if (results.length === 0) {
      results.push({
        name: `自訂估算食物 (基於：「${promptText.substr(0, 10)}...」)`,
        calories: 350,
        protein: 15,
        carbs: 45,
        fat: 10
      });
    }
    
    displayAiResults(results);
  }

  function displayAiResults(items) {
    currentAiEstimatedItems = items;
    
    el.aiResultTbody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.calories} kcal</td>
        <td>${item.protein}g</td>
        <td>${item.carbs}g</td>
        <td>${item.fat}g</td>
      </tr>
    `).join('');
    
    el.aiResultPanel.classList.remove('hidden');
    el.aiStatusIndicator.textContent = `成功分析 ${items.length} 項食物`;
    el.aiStatusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
    el.aiStatusIndicator.style.color = 'var(--accent-green)';
    
    showToast('AI 估算分析完成！請確認是否要登錄。', 'info');
  }

  el.btnAiAccept.addEventListener('click', () => {
    if (currentAiEstimatedItems.length === 0) return;
    
    const log = getActiveLog();
    currentAiEstimatedItems.forEach(item => {
      log.diet.push({
        id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: item.name,
        calories: parseInt(item.calories) || 0,
        protein: parseFloat(item.protein) || 0,
        carbs: parseFloat(item.carbs) || 0,
        fat: parseFloat(item.fat) || 0
      });
    });
    
    saveStateToStorage();
    updateUI();
    
    // Reset AI panel
    currentAiEstimatedItems = [];
    el.aiResultPanel.classList.add('hidden');
    el.aiPromptInput.value = '';
    
    showToast('已將 AI 估算的食物全數加到今日飲食！', 'success');
    triggerConfetti();
  });

  el.btnAiReject.addEventListener('click', () => {
    currentAiEstimatedItems = [];
    el.aiResultPanel.classList.add('hidden');
    showToast('已取消 AI 估算結果。', 'info');
  });

  el.btnClearAi.addEventListener('click', () => {
    el.aiPromptInput.value = '';
    currentAiEstimatedItems = [];
    el.aiResultPanel.classList.add('hidden');
  });

  // --- AI Workout Estimator Engine (Gemini API Integration via GAS Proxy) ---
  el.btnAiWorkoutEstimate.addEventListener('click', async () => {
    const promptText = el.aiWorkoutPromptInput.value.trim();
    if (!promptText) {
      showToast('請先輸入您做了什麼運動！', 'info');
      return;
    }
    
    el.btnAiWorkoutEstimate.disabled = true;
    el.btnAiWorkoutEstimate.querySelector('span').textContent = 'AI 分析中...';
    
    const sheetsUrl = state.profile.sheetsUrl;
    
    if (!sheetsUrl) {
      showToast('使用 AI 估算前，請先於右上角設定中填寫您的 Google Apps Script 同步網址以做為代理通道！', 'info');
      el.settingsModal.classList.add('active');
      el.btnAiWorkoutEstimate.disabled = false;
      el.btnAiWorkoutEstimate.querySelector('span').textContent = 'AI 估算運動消耗';
      return;
    }

    try {
      // Call Gemini parser via the Google Apps Script Web App proxy using JSONP to bypass CORS on file:// protocol
      const resData = await jsonpRequest(sheetsUrl, {
        action: 'estimateWorkout',
        text: promptText,
        weight: parseFloat(state.profile.weight) || 70
      }, 'cb_workout');
      
      if (resData.result === 'success' && Array.isArray(resData.data)) {
        displayAiWorkoutResults(resData.data);
      } else {
        throw new Error(resData.message || 'AI 估算回傳格式不正確');
      }
    } catch (err) {
      console.error('Gemini estimate workout via GAS error:', err);
      showToast('AI 估算連線失敗，改用本地智慧估算引擎模擬。', 'error');
      await simulateAiWorkoutEstimation(promptText);
    }
    
    el.btnAiWorkoutEstimate.disabled = false;
    el.btnAiWorkoutEstimate.querySelector('span').textContent = 'AI 估算運動消耗';
  });

  const MOCK_WORKOUT_DB = [
    { keywords: ['籃球'], name: '打籃球', met: 6.0, type: 'custom' },
    { keywords: ['慢跑', '跑步'], name: '慢跑 / 跑步', met: 9.8, type: 'running' },
    { keywords: ['跳繩'], name: '跳繩', met: 10.0, type: 'custom' },
    { keywords: ['重訓', '重量訓練', '啞鈴'], name: '重量訓練 / 重訓', met: 5.0, type: 'weight' },
    { keywords: ['游泳'], name: '游泳', met: 8.0, type: 'swimming' },
    { keywords: ['散步', '走路', '步行'], name: '走路 / 散步', met: 3.5, type: 'walking' },
    { keywords: ['自行車', '單車', '騎車'], name: '騎單車 / 自行車', met: 6.0, type: 'cycling' },
    { keywords: ['羽毛球', '羽球'], name: '打羽毛球', met: 5.5, type: 'custom' },
    { keywords: ['瑜珈', '瑜伽'], name: '瑜珈', met: 3.0, type: 'yoga' },
    { keywords: ['爬山', '登山'], name: '爬山 / 登山', met: 6.5, type: 'custom' }
  ];

  async function simulateAiWorkoutEstimation(promptText) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const results = [];
    const lowerText = promptText.toLowerCase();
    const weight = parseFloat(state.profile.weight) || 70;
    
    // Simple duration parser helper (looks for numbers followed by 分 or 小時)
    let duration = 30; // Default
    const hourMatch = promptText.match(/(\d+(?:\.\d+)?)\s*(?:小時|hr|hour)/);
    const minMatch = promptText.match(/(\d+)\s*(?:分鐘|分|min)/);
    
    if (hourMatch) {
      duration = Math.round(parseFloat(hourMatch[1]) * 60);
    } else if (minMatch) {
      duration = parseInt(minMatch[1]);
    }
    
    MOCK_WORKOUT_DB.forEach(w => {
      let matched = false;
      w.keywords.forEach(kw => {
        if (lowerText.includes(kw)) matched = true;
      });
      
      if (matched) {
        // Calculate calories using formula
        const calories = Math.round(w.met * weight * (duration / 60));
        results.push({
          name: w.name,
          duration: duration,
          intensity: 'medium',
          calories: calories,
          type: w.type
        });
      }
    });
    
    if (results.length === 0) {
      // Fallback
      results.push({
        name: `自訂估算運動 (基於：「${promptText.substr(0, 10)}...」)`,
        duration: duration,
        intensity: 'medium',
        calories: Math.round(5.0 * weight * (duration / 60)),
        type: 'custom'
      });
    }
    
    displayAiWorkoutResults(results);
  }

  function displayAiWorkoutResults(items) {
    currentAiEstimatedWorkouts = items;
    
    el.aiWorkoutResultTbody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td>${item.duration} 分鐘</td>
        <td>${getIntensityDisplayName(item.intensity)}</td>
        <td>${item.calories} kcal</td>
      </tr>
    `).join('');
    
    el.aiWorkoutResultPanel.classList.remove('hidden');
    el.aiWorkoutStatusIndicator.textContent = `成功分析 ${items.length} 項運動`;
    el.aiWorkoutStatusIndicator.style.background = 'rgba(255, 107, 0, 0.1)';
    el.aiWorkoutStatusIndicator.style.color = 'var(--accent-orange)';
    
    showToast('AI 運動估算完成！請確認是否要登錄。', 'info');
  }

  el.btnAiWorkoutAccept.addEventListener('click', () => {
    if (currentAiEstimatedWorkouts.length === 0) return;
    
    const log = getActiveLog();
    currentAiEstimatedWorkouts.forEach(item => {
      log.workouts.push({
        id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: item.type || 'custom',
        name: item.type === 'custom' ? item.name : '',
        duration: parseInt(item.duration) || 30,
        intensity: item.intensity || 'medium',
        calories: parseInt(item.calories) || 0
      });
    });
    
    saveStateToStorage();
    updateUI();
    
    // Reset AI panel
    currentAiEstimatedWorkouts = [];
    el.aiWorkoutResultPanel.classList.add('hidden');
    el.aiWorkoutPromptInput.value = '';
    
    showToast('已將 AI 估算的運動加到今日清單！', 'success');
    triggerConfetti();
  });

  el.btnAiWorkoutReject.addEventListener('click', () => {
    currentAiEstimatedWorkouts = [];
    el.aiWorkoutResultPanel.classList.add('hidden');
    showToast('已取消 AI 運動估算結果。', 'info');
  });

  el.btnClearWorkoutAi.addEventListener('click', () => {
    el.aiWorkoutPromptInput.value = '';
    currentAiEstimatedWorkouts = [];
    el.aiWorkoutResultPanel.classList.add('hidden');
  });

  // --- Motivation Engine Quotes & Dynamic feedback ---
  function updateMotivationWidget() {
    // Pick daily quote randomly
    const quoteIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
    const quote = MOTIVATION_QUOTES[quoteIndex];
    el.motivateQuoteText.textContent = quote.text;
    el.motivateQuoteAuthor.textContent = `— ${quote.author}`;
  }

  el.btnGetSpark.addEventListener('click', () => {
    // Calculate today's status
    const log = getActiveLog();
    const tdee = calculateTdee();
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const workoutOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const netDeficit = (tdee + workoutOut) - totalIn;
    
    const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
    const targetProtein = parseFloat(state.profile.targetProtein) || 120;
    
    const workoutCount = log.workouts.length;
    
    // Generate specialized encouraging words
    let dynamicWords = "";
    if (workoutCount > 0 && netDeficit > 200 && totalProtein >= targetProtein * 0.8) {
      dynamicWords = `太神了！今天累積了 ${workoutCount} 次運動，創造了高達 ${Math.round(netDeficit)} 大卡的熱量赤字，而且蛋白質補好補滿！你的肌肉正在瘋狂生長，脂肪也正在融化！繼續前進，你是無敵的！🔥`;
    } else if (workoutCount > 0) {
      const mins = log.workouts.reduce((sum, w) => sum + w.duration, 0);
      dynamicWords = `超讚的！你今天抽空運動了 ${mins} 分鐘，成功消耗 ${Math.round(workoutOut)} 大卡！每一次流汗都是肌肉的淬煉，身體絕對會用完美的體態回報你，堅持住！💪`;
    } else if (netDeficit > 300) {
      dynamicWords = `飲食控制一級棒！今天成功的管住嘴，創造了 ${Math.round(netDeficit)} 大卡的卡路里赤字。體脂肪正在被提取燃燒，維持這個紀律，未來7天的目標近在咫尺！✨`;
    } else if (totalProtein >= targetProtein) {
      dynamicWords = `營養大師！你今天攝取了 ${totalProtein.toFixed(1)}g 的蛋白質，完美達成增肌所需的原料供給。肌肉正在快速修復，晚上睡個好覺，明天更有爆發力！🍗`;
    } else {
      dynamicWords = `每一天都是新的起點！即使今天還沒開始動、或多吃了一點，都不要有罪惡感。踏實記錄就是成功的開始，現在就去喝杯水、做10個伏地挺身，開啟你的健康之源！🌟`;
    }
    
    el.motivateQuoteText.textContent = dynamicWords;
    el.motivateQuoteAuthor.textContent = "— FitSpark 智慧語音督導員";
    
    // Trigger effects
    triggerConfetti();
    showToast('獲得一次動力補給！', 'success');
  });

  el.btnSpeakQuote.addEventListener('click', () => {
    const textToSpeak = el.motivateQuoteText.textContent;
    if ('speechSynthesis' in window) {
      // Cancel active voice first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'zh-TW';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Attempt to find Taiwan female voice for friendly encourage style
      const voices = window.speechSynthesis.getVoices();
      const mandarinVoice = voices.find(v => v.lang.includes('ZH-TW') || v.lang.includes('zh-TW'));
      if (mandarinVoice) {
        utterance.voice = mandarinVoice;
      }
      
      window.speechSynthesis.speak(utterance);
      showToast('語音朗讀中...', 'info');
    } else {
      showToast('您的瀏覽器不支援語音合成朗讀功能。', 'error');
    }
  });

  // Ensure voices are loaded for SpeechSynthesis
  if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Just hooks to ensure voices loaded properly
    };
  }

  // --- Google Sheets Synchronization ---
  el.syncSheetsBtn.addEventListener('click', async () => {
    const sheetsUrl = state.profile.sheetsUrl;
    if (!sheetsUrl) {
      showToast('請先點擊右上角設定按鈕，設定您的 Google Apps Script Web App 同步網址。', 'info');
      // Auto open settings modal
      el.settingsModal.classList.add('active');
      return;
    }
    
    el.syncSheetsBtn.disabled = true;
    el.syncSheetsBtn.querySelector('.sync-btn-text').textContent = '同步中...';
    
    const log = getActiveLog();
    const tdee = calculateTdee();
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const workoutOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const netCalories = totalIn - (tdee + workoutOut);
    
    const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
    const totalCarbs = log.diet.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0);
    const totalFat = log.diet.reduce((sum, item) => sum + (parseFloat(item.fat) || 0), 0);
    const totalExerciseMins = log.workouts.reduce((sum, w) => sum + w.duration, 0);
    
    const p = state.profile;
    const syncData = {
      date: currentActiveDate,
      weight: parseFloat(p.weight) || 70,
      muscle: parseFloat(p.muscle) || 30,
      bodyFat: parseFloat(p.fatPercent) || 20,
      caloriesIn: Math.round(totalIn),
      caloriesOut: Math.round(tdee + workoutOut),
      netCalories: Math.round(netCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      exerciseMinutes: totalExerciseMins
    };
    
    try {
      // Send via JSONP to bypass CORS limitations on file:// protocol
      const resData = await jsonpRequest(sheetsUrl, {
        action: 'syncData',
        data: JSON.stringify(syncData)
      }, 'cb_sync');
      
      if (resData.result === 'success') {
        showToast('同步成功！數據已寫入 Google Sheets！', 'success');
        triggerConfetti();
      } else {
        throw new Error(resData.message || '寫入試算表失敗');
      }
    } catch (err) {
      console.error('Google Sheets sync error:', err);
      showToast('同步連線失敗，請檢查 Apps Script 網址與網路設定。', 'error');
    } finally {
      el.syncSheetsBtn.disabled = false;
      el.syncSheetsBtn.querySelector('.sync-btn-text').textContent = '同步 Sheets';
    }
  });

  // --- Settings Form Dialog ---
  el.settingsBtn.addEventListener('click', () => {
    // Fill settings inputs with current profile state
    const p = state.profile;
    el.inputGender.value = p.gender;
    el.inputAge.value = p.age;
    el.inputHeight.value = p.height;
    el.inputWeight.value = p.weight;
    el.inputMuscle.value = p.muscle;
    el.inputFatPercent.value = p.fatPercent;
    el.inputActivity.value = p.activity;
    el.inputRestDays.value = p.restDays !== undefined ? p.restDays : 2;
    
    el.targetCalories.value = p.targetCalories;
    el.targetProtein.value = p.targetProtein;
    el.targetCarbs.value = p.targetCarbs;
    el.targetFat.value = p.targetFat;
    
    el.inputSheetUrl.value = p.sheetsUrl || '';
    
    el.settingsModal.classList.add('active');
  });

  el.btnEditProfileTab.addEventListener('click', () => {
    el.settingsBtn.click();
  });

  el.btnCloseSettings.addEventListener('click', () => {
    el.settingsModal.classList.remove('active');
  });

  // Close modal when clicking on backdrop
  el.settingsModal.addEventListener('click', (e) => {
    if (e.target === el.settingsModal) {
      el.settingsModal.classList.remove('active');
    }
  });



  el.btnClearSettings.addEventListener('click', () => {
    if (confirm('確定要清除所有設定與本地歷史數據嗎？此動作不可逆！')) {
      localStorage.removeItem('fitspark_state');
      state = {
        profile: {
          gender: 'male',
          age: 28,
          height: 175,
          weight: 70,
          muscle: 30,
          fatPercent: 20,
          activity: 1.2,
          restDays: 2,
          targetCalories: 2000,
          targetProtein: 120,
          targetCarbs: 220,
          targetFat: 60,
          sheetsUrl: 'https://script.google.com/macros/s/AKfycbwXBXuAWhKEXLtefZ4DCpBSPwbjRL5b8JF6dcFKeJ8dkdRdvf56gNnQDnWUporcRCtW/exec',
          favoriteWorkouts: [
            { type: 'weight', name: '常規重量訓練', duration: 45, intensity: 'medium', calories: 225 },
            { type: 'running', name: '有氧慢跑', duration: 30, intensity: 'medium', calories: 343 },
            { type: 'walking', name: '休閒散步', duration: 40, intensity: 'medium', calories: 163 }
          ],
          favoriteDiet: [
            { name: '茶葉蛋 (2顆)', calories: 150, protein: 12.6, carbs: 1.2, fat: 10 },
            { name: '無糖豆漿 (400ml)', calories: 130, protein: 13, carbs: 4.8, fat: 6.5 },
            { name: '烤雞腿便當 (1個)', calories: 820, protein: 32, carbs: 95, fat: 32 }
          ]
        },
        dailyLogs: {}
      };
      currentActiveDate = getTodayDateString();
      getActiveLog();
      saveStateToStorage();
      updateUI();
      el.settingsModal.classList.remove('active');
      showToast('所有本地數據已重設。', 'info');
    }
  });

  el.btnSaveSettings.addEventListener('click', () => {
    // Validate required fields
    if (!el.settingsForm.reportValidity()) return;
    
    const p = state.profile;
    p.gender = el.inputGender.value;
    p.age = parseInt(el.inputAge.value) || 28;
    p.height = parseFloat(el.inputHeight.value) || 175;
    p.weight = parseFloat(el.inputWeight.value) || 70;
    p.muscle = parseFloat(el.inputMuscle.value) || 30;
    p.fatPercent = parseFloat(el.inputFatPercent.value) || 20;
    p.activity = parseFloat(el.inputActivity.value) || 1.2;
    
    p.targetCalories = parseInt(el.targetCalories.value) || 2000;
    p.targetProtein = parseInt(el.targetProtein.value) || 120;
    p.targetCarbs = parseInt(el.targetCarbs.value) || 220;
    p.targetFat = parseInt(el.targetFat.value) || 60;
    
    p.restDays = parseInt(el.inputRestDays.value) || 0;
    p.sheetsUrl = el.inputSheetUrl.value.trim();
    
    saveStateToStorage();
    updateUI();
    
    el.settingsModal.classList.remove('active');
    showToast('設定已儲存！', 'success');
  });

  // --- Favorite Prompts Clicking Handlers ---
  document.querySelectorAll('.fav-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      const isWorkout = chip.closest('#workout-fav-chips') !== null;
      const targetTextarea = isWorkout ? el.aiWorkoutPromptInput : el.aiPromptInput;
      if (targetTextarea) {
        targetTextarea.value = text;
        targetTextarea.focus();
        targetTextarea.classList.add('pulse-highlight');
        setTimeout(() => targetTextarea.classList.remove('pulse-highlight'), 1000);
        showToast('已填入常用口語描述！', 'info');
      }
    });
  });

  // --- Tab Switching Logic ---
  el.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Deactivate other tabs
      el.tabBtns.forEach(b => b.classList.remove('active'));
      el.tabPanes.forEach(p => p.classList.remove('active'));
      
      // Activate this tab
      btn.classList.add('active');
      const activePane = document.getElementById(`tab-content-${tabName}`);
      if (activePane) activePane.classList.add('active');
    });
  });

  // --- Custom Toast System ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;
    
    el.toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }

  // --- Confetti particle engine ---
  let confettiParticles = [];
  const ctx = el.confettiCanvas.getContext('2d');
  
  function resizeConfettiCanvas() {
    el.confettiCanvas.width = window.innerWidth;
    el.confettiCanvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeConfettiCanvas);
  resizeConfettiCanvas();

  function triggerConfetti() {
    const colors = ['#ff6b00', '#ffa800', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];
    const pCount = 80;
    
    // Burst from bottom left and right
    // Left burst
    for (let i = 0; i < pCount / 2; i++) {
      confettiParticles.push(createConfettiParticle(0, el.confettiCanvas.height, 45, colors));
    }
    // Right burst
    for (let i = 0; i < pCount / 2; i++) {
      confettiParticles.push(createConfettiParticle(el.confettiCanvas.width, el.confettiCanvas.height, 135, colors));
    }
  }

  function createConfettiParticle(x, y, baseAngle, colors) {
    const angle = (baseAngle + (Math.random() * 40 - 20)) * Math.PI / 180;
    const speed = 10 + Math.random() * 15;
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      size: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      alpha: 1,
      decay: 0.015 + Math.random() * 0.015
    };
  }

  function updateConfetti() {
    ctx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);
    
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravity
      p.vx *= 0.98; // resistance
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;
      
      if (p.alpha <= 0 || p.y > el.confettiCanvas.height) {
        confettiParticles.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    
    requestAnimationFrame(updateConfetti);
  }
  
  // Start confetti tick
  updateConfetti();

  // --- App Initialization ---
  function init() {
    loadStateFromStorage();
    startClock();
    updateMotivationWidget();
    updateUI();
    
    // Smooth transition loader fade-out
    setTimeout(() => {
      el.appLoader.classList.add('hidden');
    }, 600);
  }

  init();
});

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

  function isWeightTraining(w) {
    if (!w) return false;
    if (w.type === 'weight') return true;
    const name = (w.name || '').toLowerCase();
    const keywords = [
      '重訊', '重訓', '重量', '阻力', '阻抗', '伏地挺身', '深蹲', '引體向上', '仰臥起坐',
      '俯臥撐', '啞鈴', '壺鈴', '槓鈴', '推舉', '硬舉', '拉背', '臥推', '平板撐',
      '撐體', '波比跳', '核心', '力量訓練', '阻力訓練', '胸推', '划船',
      'squat', 'pushup', 'push-up', 'pullup', 'pull-up', 'dumbbell', 'barbell',
      'kettlebell', 'lunge', 'deadlift', 'press', 'strength', 'resistance',
      'plank', 'bench press', 'bodyweight', 'push up', 'pull up'
    ];
    return keywords.some(kw => name.includes(kw));
  }

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

  let historyCharts = { weight: null, muscle: null, fat: null, waist: null, chest: null, biceps: null };
  let activeChartRange = 7;

  // --- Last Computed Estimated Body State ---
  let lastEstimatedBodyState = null;

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
    ringProgressInOverflow: document.getElementById('ring-progress-in-overflow'),
    ringProgressOut: document.getElementById('ring-progress-out'),
    ringProgressOutOverflow: document.getElementById('ring-progress-out-overflow'),
    
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
    btnCopyWorkoutPrompt: document.getElementById('btn-copy-workout-prompt'),
    btnClearWorkoutAi: document.getElementById('btn-clear-workout-ai'),
    aiWorkoutResultPanel: document.getElementById('ai-workout-result-panel'),
    aiWorkoutStatusIndicator: document.getElementById('ai-workout-status-indicator'),
    aiWorkoutResultTbody: document.getElementById('ai-workout-result-tbody'),
    btnAiWorkoutAccept: document.getElementById('btn-ai-workout-accept'),
    btnAiWorkoutReject: document.getElementById('btn-ai-workout-reject'),
    
    // Diet Panel
    aiPromptInput: document.getElementById('ai-prompt-input'),
    btnAiEstimate: document.getElementById('btn-ai-estimate'),
    btnCopyDietPrompt: document.getElementById('btn-copy-diet-prompt'),
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
    dynamicProjectionStatus: document.getElementById('dynamic-projection-status'),
    
    // Settings Modal Inputs
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    
    // Sync Modal
    syncModal: document.getElementById('sync-modal'),
    btnCloseSync: document.getElementById('btn-close-sync'),
    btnSyncDownload: document.getElementById('btn-sync-download'),
    btnSyncUpload: document.getElementById('btn-sync-upload'),
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
    toastContainer: document.getElementById('toast-container'),
    
    // Date Switcher
    activeDatePicker: document.getElementById('active-date-picker'),
    btnPrevDay: document.getElementById('btn-prev-day'),
    btnNextDay: document.getElementById('btn-next-day'),
    
    // Estimated Body elements
    estWeightVal: document.getElementById('est-weight-val'),
    estMuscleVal: document.getElementById('est-muscle-val'),
    estFatVal: document.getElementById('est-fat-val'),
    estSummaryText: document.getElementById('est-summary-text'),
    btnApplyEstBody: document.getElementById('btn-apply-est-body'),
    inputDailyWeight: document.getElementById('input-daily-weight'),
    inputDailyMuscle: document.getElementById('input-daily-muscle'),
    inputDailyFat: document.getElementById('input-daily-fat'),
    inputDailyWaist: document.getElementById('input-daily-waist'),
    inputDailyChest: document.getElementById('input-daily-chest'),
    inputDailyBiceps: document.getElementById('input-daily-biceps'),
    btnSaveDailyWeight: document.getElementById('btn-save-daily-weight'),
    dailyComparisonBox: document.getElementById('daily-comparison-box'),
    tdeeCalibratedBadge: document.getElementById('tdee-calibrated-badge'),
    adaptiveTdeeInfo: document.getElementById('adaptive-tdee-info'),
    adaptiveTdeeOffsetVal: document.getElementById('adaptive-tdee-offset-val'),
    aiCoachDeepBox: document.getElementById('ai-coach-deep-box'),
    bodyShapeAvatar: document.getElementById('body-shape-avatar'),
    btnToggleScan: document.getElementById('btn-toggle-scan'),
    btnToggleSprite: document.getElementById('btn-toggle-sprite'),
    bodyShapeSprite: document.getElementById('body-shape-sprite'),
    spriteScanlineCanvas: document.getElementById('sprite-scanline-canvas'),
    avatarPreviewBadge: document.getElementById('avatar-preview-badge'),
    bodyMatrixGrid: document.getElementById('body-matrix-grid'),
    bodyMatrixDetails: document.getElementById('body-matrix-details'),
    btnTriggerAiCoach: document.getElementById('btn-trigger-ai-coach'),
    btnCopyCoachPrompt: document.getElementById('btn-copy-coach-prompt'),
    aiCoachDeepResult: document.getElementById('ai-coach-deep-result'),
    insightProteinData: document.getElementById('insight-protein-data'),
    insightProteinHighVal: document.getElementById('insight-protein-high-val'),
    insightProteinHighBar: document.getElementById('insight-protein-high-bar'),
    insightProteinLowVal: document.getElementById('insight-protein-low-val'),
    insightProteinLowBar: document.getElementById('insight-protein-low-bar'),
    insightWorkoutData: document.getElementById('insight-workout-data'),
    insightWorkoutYesVal: document.getElementById('insight-workout-yes-val'),
    insightWorkoutYesBar: document.getElementById('insight-workout-yes-bar'),
    insightWorkoutNoVal: document.getElementById('insight-workout-no-val'),
    insightWorkoutNoBar: document.getElementById('insight-workout-no-bar'),
    
    // Calorie Bank elements
    bankDepositVal: document.getElementById('bank-deposit-val'),
    bankWithdrawVal: document.getElementById('bank-withdraw-val'),
    bankRemainingPercent: document.getElementById('bank-remaining-percent'),
    bankProgressBar: document.getElementById('bank-progress-bar'),
    bankMsgBox: document.getElementById('bank-msg-box'),
    
    // Body Size Estimator elements
    estWaistVal: document.getElementById('est-waist-val'),
    estChestVal: document.getElementById('est-chest-val'),
    estBicepsVal: document.getElementById('est-biceps-val'),
    proj7Waist: document.getElementById('proj-7-waist'),
    proj7Chest: document.getElementById('proj-7-chest'),
    proj7Biceps: document.getElementById('proj-7-biceps'),
    proj30Waist: document.getElementById('proj-30-waist'),
    proj30Chest: document.getElementById('proj-30-chest'),
    proj30Biceps: document.getElementById('proj-30-biceps')
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

  // --- POST Request Helper to send data to Apps Script Web App ---
  async function postRequest(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }
    
    const resText = await response.text();
    try {
      return JSON.parse(resText);
    } catch (err) {
      throw new Error('伺服器回傳格式不正確，無法解析為 JSON。');
    }
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

  // --- Adaptive TDEE Calibrator ---
  function calculateAdaptiveTdeeOffset() {
    const allDatesSorted = Object.keys(state.dailyLogs).sort();
    
    // We need days that have both logged weight AND diet logs (to estimate calorie intake)
    const validWeightDates = allDatesSorted.filter(d => {
      const entry = state.dailyLogs[d];
      return entry && 
             entry.weight !== undefined && 
             entry.weight !== null && 
             entry.weight > 0 && 
             entry.diet && 
             entry.diet.length > 0;
    });

    // We need at least 7 days of actual logged weight/diet to perform adaptive calibration
    if (validWeightDates.length < 7) {
      return 0;
    }

    const firstDate = validWeightDates[0];
    const lastDate = validWeightDates[validWeightDates.length - 1];

    const firstWeight = parseFloat(state.dailyLogs[firstDate].weight);
    const lastWeight = parseFloat(state.dailyLogs[lastDate].weight);
    const actualWeightChange = lastWeight - firstWeight;

    // Calculate total expected balance and TDEE based on formula for dates in range
    const dStart = new Date(firstDate + 'T00:00:00');
    const dEnd = new Date(lastDate + 'T00:00:00');
    const diffDays = Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 7) {
      return 0;
    }

    let totalIn = 0;
    let totalWorkoutOut = 0;
    let baseTdeeSum = 0;

    const bmr = calculateBmr();
    const activityFactor = parseFloat(state.profile.activity) || 1.2;
    const baseTdee = Math.round(bmr * activityFactor);

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(dStart);
      d.setDate(dStart.getDate() + i);
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const entry = state.dailyLogs[dateStr];
      if (entry) {
        const hasDietLogged = entry.diet && entry.diet.length > 0;
        const dayIn = hasDietLogged ? entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : baseTdee;
        const dayWorkoutOut = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const dayWorkoutMins = entry.workouts ? entry.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        const dayDoubleCounted = Math.round((baseTdee / 1440) * dayWorkoutMins);
        
        totalIn += dayIn;
        totalWorkoutOut += Math.max(0, dayWorkoutOut - dayDoubleCounted);
        baseTdeeSum += baseTdee;
      } else {
        totalIn += baseTdee;
        baseTdeeSum += baseTdee;
      }
    }

    const calorieDifference = totalIn - baseTdeeSum - totalWorkoutOut;
    const expectedWeightChangeCal = actualWeightChange * 7700;
    
    let offset = (calorieDifference - expectedWeightChangeCal) / (diffDays || 1);

    if (isNaN(offset)) return 0;
    offset = Math.max(-500, Math.min(500, offset));
    return Math.round(offset);
  }

  function calculateTdee() {
    const bmr = calculateBmr();
    const factor = parseFloat(state.profile.activity) || 1.2;
    const baseTdee = Math.round(bmr * factor);
    const offset = calculateAdaptiveTdeeOffset();
    return baseTdee + offset;
  }

  // --- Base Body Size Estimator Formula ---
  function calculateBaseBodyMeasurements(gender, height, weight, fatPercent) {
    const fm = weight * (fatPercent / 100);
    const ffm = weight * (1 - fatPercent / 100);
    
    let waist = 0;
    let chest = 0;
    let biceps = 0;
    
    // Detect if user has the custom "lean limbs, fat trunk" profile (height ~ 179cm, male)
    const isCustomProfile = gender === 'male' && (height >= 177 && height <= 181);
    
    if (gender === 'female') {
      waist = height * 0.35 + fm * 1.0;
      chest = height * 0.28 + ffm * 0.5 + fm * 0.35 + 8;
      biceps = ffm * 0.3 + fm * 0.25 + 8;
    } else {
      // Default: male
      let waistFatCoeff = 1.2;
      let chestFatCoeff = 0.2;
      let bicepsFatCoeff = 0.2;
      
      if (isCustomProfile) {
        // Lean limbs, fat concentrated in waist (Android/trunk type)
        waistFatCoeff = 1.35;  // Fat has greater impact on waist size
        chestFatCoeff = 0.1;   // Fat has less impact on chest size
        bicepsFatCoeff = 0.05; // Limbs have very little fat, size is muscle-dominated
      }
      
      waist = height * 0.38 + fm * waistFatCoeff;
      chest = height * 0.3 + ffm * 0.6 + fm * chestFatCoeff + 12;
      biceps = ffm * 0.35 + fm * bicepsFatCoeff + 10;
    }
    
    return {
      waist: waist,
      chest: chest,
      biceps: biceps
    };
  }

  // --- Body Measurement Offsets Calibration ---
  function calculateMeasurementOffsets() {
    let sumWaistDiff = 0, countWaist = 0;
    let sumChestDiff = 0, countChest = 0;
    let sumBicepsDiff = 0, countBiceps = 0;
    
    const p = state.profile;
    const gender = p.gender || 'male';
    const height = parseFloat(p.height) || 175;
    
    // Get historical estimated weight and fatPercent trend to match with logged actual sizes
    const history = getBodyStateHistoryUpTo(currentActiveDate);
    const weightHistory = history.weightHistory || {};
    const fatPercentHistory = history.fatPercentHistory || {};
    
    Object.keys(state.dailyLogs).forEach(date => {
      const log = state.dailyLogs[date];
      if (!log) return;
      
      const hasWaist = log.waist !== undefined && log.waist !== null && log.waist > 0;
      const hasChest = log.chest !== undefined && log.chest !== null && log.chest > 0;
      const hasBiceps = log.biceps !== undefined && log.biceps !== null && log.biceps > 0;
      
      if (hasWaist || hasChest || hasBiceps) {
        // Fetch estimated weight and fat percent for this day
        const wEst = weightHistory[date] || parseFloat(p.weight) || 70;
        const fEst = fatPercentHistory[date] || parseFloat(p.fatPercent) || 20;
        
        // Base estimation
        const base = calculateBaseBodyMeasurements(gender, height, wEst, fEst);
        
        if (hasWaist) {
          sumWaistDiff += parseFloat(log.waist) - base.waist;
          countWaist++;
        }
        if (hasChest) {
          sumChestDiff += parseFloat(log.chest) - base.chest;
          countChest++;
        }
        if (hasBiceps) {
          sumBicepsDiff += parseFloat(log.biceps) - base.biceps;
          countBiceps++;
        }
      }
    });
    
    return {
      waist: countWaist > 0 ? (sumWaistDiff / countWaist) : 0,
      chest: countChest > 0 ? (sumChestDiff / countChest) : 0,
      biceps: countBiceps > 0 ? (sumBicepsDiff / countBiceps) : 0
    };
  }

  // --- Calibrated Body Size Estimator ---
  function calculateBodyMeasurements(gender, height, weight, fatPercent) {
    const base = calculateBaseBodyMeasurements(gender, height, weight, fatPercent);
    const offsets = calculateMeasurementOffsets();
    
    return {
      waist: (base.waist + offsets.waist).toFixed(1),
      chest: (base.chest + offsets.chest).toFixed(1),
      biceps: (base.biceps + offsets.biceps).toFixed(1)
    };
  }

  // --- Plateau Detector ---
  function detectWeightPlateau() {
    const allDatesSorted = Object.keys(state.dailyLogs).sort();
    
    // Look at last 14 days of history up to currentActiveDate
    const dStart = new Date(currentActiveDate + 'T00:00:00');
    dStart.setDate(dStart.getDate() - 13); // 14-day window

    const recentWeightLogs = [];
    let totalCalBalance = 0;
    let loggedDeficitDays = 0;
    
    const bmr = calculateBmr();
    const activityFactor = parseFloat(state.profile.activity) || 1.2;
    const baseTdee = Math.round(bmr * activityFactor) + calculateAdaptiveTdeeOffset();

    for (let i = 0; i < 14; i++) {
      const d = new Date(dStart);
      d.setDate(dStart.getDate() + i);
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const entry = state.dailyLogs[dateStr];
      if (entry) {
        if (entry.weight !== undefined && entry.weight !== null && entry.weight > 0) {
          recentWeightLogs.push(parseFloat(entry.weight));
        }
        const dayIn = entry.diet ? entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const dayWorkoutOut = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const balance = dayIn - (baseTdee + dayWorkoutOut);
        
        if (balance < -100) {
          totalCalBalance += balance;
          loggedDeficitDays++;
        }
      }
    }

    if (recentWeightLogs.length < 5) {
      return false;
    }

    const mean = recentWeightLogs.reduce((sum, val) => sum + val, 0) / recentWeightLogs.length;
    const sqDiffSum = recentWeightLogs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const stdDev = Math.sqrt(sqDiffSum / recentWeightLogs.length);

    const isWeightFlat = stdDev < 0.15;
    const hasDeficit = loggedDeficitDays >= 3 && (totalCalBalance / loggedDeficitDays) < -200;

    return isWeightFlat && hasDeficit;
  }

  // --- Cross-Correlation Insights Generator ---
  function calculateCrossCorrelations() {
    const allDatesSorted = Object.keys(state.dailyLogs).sort();
    const pastDates = allDatesSorted.filter(d => d <= currentActiveDate);
    
    const p = state.profile;
    const targetProtein = parseFloat(p.targetProtein) || 120;

    const history = getBodyStateHistoryUpTo(currentActiveDate);
    const muscleHist = history.muscleHistory;
    const fatPctHist = history.fatPercentHistory;

    let proteinHighDays = 0;
    let proteinHighMuscleChangeSum = 0;
    let proteinLowDays = 0;
    let proteinLowMuscleChangeSum = 0;

    let workoutYesDays = 0;
    let workoutYesFatPctChangeSum = 0;
    let workoutNoDays = 0;
    let workoutNoFatPctChangeSum = 0;

    for (let i = 1; i < pastDates.length; i++) {
      const prevDate = pastDates[i - 1];
      const currDate = pastDates[i];
      const entry = state.dailyLogs[prevDate];
      if (!entry) continue;

      const prevMuscle = muscleHist[prevDate];
      const currMuscle = muscleHist[currDate];
      const prevFatPct = fatPctHist[prevDate];
      const currFatPct = fatPctHist[currDate];

      if (prevMuscle === undefined || currMuscle === undefined || prevFatPct === undefined || currFatPct === undefined) {
        continue;
      }

      const dailyMuscleChange = currMuscle - prevMuscle;
      const dailyFatPctChange = currFatPct - prevFatPct;

      const dayProtein = entry.diet ? entry.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0) : 0;
      const hasDiet = entry.diet && entry.diet.length > 0;
      
      if (hasDiet) {
        if (dayProtein >= targetProtein * 0.8) {
          proteinHighDays++;
          proteinHighMuscleChangeSum += dailyMuscleChange;
        } else {
          proteinLowDays++;
          proteinLowMuscleChangeSum += dailyMuscleChange;
        }
      }

      const weightTrainingMins = entry.workouts ? entry.workouts
        .filter(isWeightTraining)
        .reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
      const hasWorkouts = entry.workouts && entry.workouts.length > 0;

      if (hasWorkouts || hasDiet) {
        if (weightTrainingMins >= 30) {
          workoutYesDays++;
          workoutYesFatPctChangeSum += dailyFatPctChange;
        } else {
          workoutNoDays++;
          workoutNoFatPctChangeSum += dailyFatPctChange;
        }
      }
    }

    const avgMuscleChangeProteinHigh = proteinHighDays > 0 ? (proteinHighMuscleChangeSum / proteinHighDays) : 0;
    const avgMuscleChangeProteinLow = proteinLowDays > 0 ? (proteinLowMuscleChangeSum / proteinLowDays) : 0;

    const avgFatPctChangeWorkoutYes = workoutYesDays > 0 ? (workoutYesFatPctChangeSum / workoutYesDays) : 0;
    const avgFatPctChangeWorkoutNo = workoutNoDays > 0 ? (workoutNoFatPctChangeSum / workoutNoDays) : 0;

    return {
      proteinHighDays,
      proteinLowDays,
      avgMuscleChangeProteinHigh,
      avgMuscleChangeProteinLow,
      workoutYesDays,
      workoutNoDays,
      avgFatPctChangeWorkoutYes,
      avgFatPctChangeWorkoutNo
    };
  }

  // --- Calorie Bank & Weekend Cheat Meal Budget ---
  function getWeekRange(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay(); // 0: Sunday, 1: Monday, etc.
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const pad = (n) => String(n).padStart(2, '0');
      dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    return {
      monday: dates[0],
      tuesday: dates[1],
      wednesday: dates[2],
      thursday: dates[3],
      friday: dates[4],
      saturday: dates[5],
      sunday: dates[6],
      weekDays: dates.slice(0, 5),
      weekendDays: dates.slice(5, 7)
    };
  }

  function updateCalorieBankUI() {
    if (!el.bankDepositVal || !el.bankWithdrawVal || !el.bankRemainingPercent || !el.bankProgressBar || !el.bankMsgBox) {
      return;
    }
    
    const tdee = calculateTdee();
    const { weekDays, weekendDays } = getWeekRange(currentActiveDate);
    
    let totalDeficit = 0;
    let weekendSurplus = 0;
    
    // 1. Calculate Monday-Friday deficits
    weekDays.forEach(d => {
      const entry = state.dailyLogs[d];
      if (entry && entry.diet && entry.diet.length > 0) {
        const intake = entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const workout = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const workoutMins = entry.workouts ? entry.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        const doubleCounted = Math.round((tdee / 1440) * workoutMins);
        // Deficit = (TDEE + Workout - DoubleCounted) - Intake
        const dailyDeficit = (tdee + workout - doubleCounted) - intake;
        totalDeficit += dailyDeficit;
      }
    });
    
    // Ensure deposit isn't negative for UI display (though internally it could be)
    const displayDeposit = Math.max(0, Math.round(totalDeficit));
    el.bankDepositVal.textContent = `${displayDeposit} kcal`;
    
    // 2. Calculate Saturday-Sunday withdrawals (consumption exceeding TDEE + Workouts)
    weekendDays.forEach(d => {
      const entry = state.dailyLogs[d];
      if (entry && entry.diet && entry.diet.length > 0) {
        const intake = entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const workout = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const workoutMins = entry.workouts ? entry.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        const doubleCounted = Math.round((tdee / 1440) * workoutMins);
        const dailySurplus = intake - (tdee + workout - doubleCounted);
        if (dailySurplus > 0) {
          weekendSurplus += dailySurplus;
        }
      }
    });
    
    const displayWithdraw = Math.round(weekendSurplus);
    el.bankWithdrawVal.textContent = `${displayWithdraw} kcal`;
    
    // 3. Remaining balance and progress bar
    const remaining = displayDeposit - displayWithdraw;
    const remainingPct = displayDeposit > 0 ? Math.max(0, Math.min(100, (remaining / displayDeposit) * 100)) : 0;
    
    el.bankRemainingPercent.textContent = `${Math.round(remainingPct)}%`;
    el.bankProgressBar.style.width = `${remainingPct}%`;
    
    if (remainingPct > 50) {
      el.bankProgressBar.style.background = 'linear-gradient(90deg, var(--accent-green), var(--accent-yellow))';
    } else if (remainingPct > 20) {
      el.bankProgressBar.style.background = 'linear-gradient(90deg, var(--accent-yellow), var(--accent-orange))';
    } else {
      el.bankProgressBar.style.background = 'linear-gradient(90deg, var(--accent-orange), #ef4444)';
    }
    
    // 4. Update the message box based on current active date
    const today = new Date(currentActiveDate + 'T00:00:00');
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    
    let msgHTML = '';
    if (dayOfWeek === 0) { // Sunday - Weekly Settlement Day
      if (remaining > 0) {
        const fatLost = (remaining / 7700).toFixed(2);
        msgHTML = `
          <div style="text-align: center; margin-bottom: 8px; font-size: 28px;">🏆</div>
          <div style="font-weight: 700; color: var(--accent-green); text-align: center; margin-bottom: 6px; font-size: 13px;">【本週結算：綠色健康週！】</div>
          恭喜！本週您的卡路里銀行完美結餘 <strong style="color: var(--accent-green);">${Math.round(remaining)} kcal</strong>，相當於順利減去約 <strong style="color: var(--accent-green);">${fatLost} kg</strong> 脂肪！做得太棒了！
        `;
      } else if (displayDeposit === 0) {
        msgHTML = `
          <div style="text-align: center; margin-bottom: 8px; font-size: 28px;">💡</div>
          <div style="font-weight: 700; color: var(--text-secondary); text-align: center; margin-bottom: 6px; font-size: 13px;">【本週結算：無赤字存款】</div>
          您本週週間（週一至週五）沒有累積任何卡路里赤字。沒關係，調整好狀態，明天星期一重新開戶，我們再接再厲！
        `;
      } else {
        msgHTML = `
          <div style="text-align: center; margin-bottom: 8px; font-size: 28px;">✉️</div>
          <div style="font-weight: 700; color: #ef4444; text-align: center; margin-bottom: 6px; font-size: 13px;">【本週結算：銀行已超支】</div>
          本週您的卡路里銀行透支了 <strong style="color: #ef4444;">${Math.round(-remaining)} kcal</strong>。<br>沒關係，新的一週即將開始！明天星期一我們重新開戶，調整腳步繼續加油！
        `;
      }
    } else if (dayOfWeek === 6) { // Saturday
      if (remaining > 0) {
        msgHTML = `🎉 <strong>週末放縱餐！</strong>目前銀行餘額還剩 <strong style="color: var(--accent-green);">${Math.round(remaining)} kcal</strong>。<br>您今天可以安心享用額外美食而不影響本週減脂進度！`;
      } else if (displayDeposit === 0) {
        msgHTML = `💡 <strong>貼心提醒：</strong>您本週週間沒有累積任何卡路里赤字存款。週末建議維持正常 TDEE 攝取以避免脂肪囤積喔！`;
      } else {
        msgHTML = `⚠️ <strong>銀行已透支！</strong>您的週末大餐已超出本週所存的 <strong style="color: #ef4444;">${Math.round(-remaining)} kcal</strong>。<br>建議今天多散步或進行 30 分鐘有氧運動來補回赤字！`;
      }
    } else {
      // Weekdays
      if (displayDeposit > 0) {
        const weekendDailyBudget = Math.round(displayDeposit / 2);
        msgHTML = `💪 <strong>積沙成塔中！</strong>本週已為週末大餐存下 <strong style="color: var(--accent-green);">${displayDeposit} kcal</strong>。<br>預估這週末<strong>每天可以多吃 ${weekendDailyBudget} kcal</strong> 的美食！繼續保持！`;
      } else {
        msgHTML = `🏦 <strong>卡路里銀行已開戶！</strong>週一至週五多運動或少攝取熱量，所創造的赤字會存入此處。週末就能轉換為無罪惡感的放縱餐額度！`;
      }
    }
    
    el.bankMsgBox.innerHTML = msgHTML;
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
    const log = getActiveLog();
    
    // Helper to find the latest logged value on or before currentActiveDate (Scheme B/Option 2 starting baseline)
    function getLatestLoggedValue(key, fallbackVal) {
      const dActiveTemp = new Date(currentActiveDate + 'T00:00:00');
      // Look back up to 60 days
      for (let i = 0; i < 60; i++) {
        const d = new Date(dActiveTemp);
        d.setDate(dActiveTemp.getDate() - i);
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        
        const entry = state.dailyLogs[dateStr];
        if (entry && entry[key] !== undefined && entry[key] !== null && parseFloat(entry[key]) > 0) {
          return parseFloat(entry[key]);
        }
      }
      return fallbackVal;
    }
    
    const currentWeight = getLatestLoggedValue('weight', parseFloat(p.weight) || 70);
    const currentMuscle = getLatestLoggedValue('muscle', parseFloat(p.muscle) || 30);
    const currentFatPct = getLatestLoggedValue('fatPercent', parseFloat(p.fatPercent) || 20);
    const loggedWaist = getLatestLoggedValue('waist', null);
    const loggedChest = getLatestLoggedValue('chest', null);
    const loggedBiceps = getLatestLoggedValue('biceps', null);
    
    const dActive = new Date(currentActiveDate + 'T00:00:00');
    const tdee = calculateTdee();
    const restDays = parseInt(p.restDays) || 0;
    const trainingDays = Math.max(0, 7 - restDays);
    // Today's single day stats for UI display (with double counting adjusted)
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const workoutOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const workoutMins = log.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
    const doubleCounted = Math.round((tdee / 1440) * workoutMins);
    const totalOut = tdee + workoutOut - doubleCounted;
    const netDeficit = totalOut - totalIn; 
    
    const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);

    // Calculate 7-day average data up to currentActiveDate for stable projections
    let sum7In = 0;
    let sum7WorkoutOut = 0;
    let sum7WorkoutMins = 0;
    let sum7Protein = 0;
    let sum7WeightTrainingMins = 0;
    let loggedDietDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(dActive);
      d.setDate(dActive.getDate() - i);
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const entry = state.dailyLogs[dateStr];
      if (entry) {
        const hasDiet = entry.diet && entry.diet.length > 0;
        if (hasDiet) {
          sum7In += entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
          sum7Protein += entry.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
          loggedDietDays++;
        }
        
        const dayWorkout = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const dayMins = entry.workouts ? entry.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        const dayWeightTraining = entry.workouts ? entry.workouts.filter(isWeightTraining).reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        
        sum7WorkoutOut += dayWorkout;
        sum7WorkoutMins += dayMins;
        sum7WeightTrainingMins += dayWeightTraining;
      }
    }
    
    const avgDailyIn = loggedDietDays > 0 ? (sum7In / loggedDietDays) : tdee;
    const avgDailyWorkoutOutRaw = sum7WorkoutOut / 7;
    const avgDailyWorkoutMins = sum7WorkoutMins / 7;
    const avgDoubleCounted = Math.round((tdee / 1440) * avgDailyWorkoutMins);
    const avgDailyWorkoutOut = Math.max(0, avgDailyWorkoutOutRaw - avgDoubleCounted);
    
    const avgDailyProtein = loggedDietDays > 0 ? (sum7Protein / loggedDietDays) : 0;
    const targetProtein = parseFloat(p.targetProtein) || 120;
    const hasEnoughProtein = avgDailyProtein >= (targetProtein * 0.8);
    
    // Weight training check: total strength training minutes over the last 7 days is >= 90 mins (equivalent to 3 times a week, 30 mins each)
    const hasWeightTraining = sum7WeightTrainingMins >= 90;
    
    // Average weekly daily balance (intake - total output)
    const avgDailyBalance = avgDailyIn - (tdee + avgDailyWorkoutOut);
    
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
    
    // Calculate and render projected size measurements (waist, chest, biceps)
    const curSizes = calculateBodyMeasurements(p.gender, p.height, currentWeight, currentFatPct);
    const sizes7 = calculateBodyMeasurements(p.gender, p.height, future7Weight, future7FatPct);
    const sizes30 = calculateBodyMeasurements(p.gender, p.height, future30Weight, future30FatPct);
    
    const curWaist = loggedWaist !== null ? loggedWaist : parseFloat(curSizes.waist);
    const curChest = loggedChest !== null ? loggedChest : parseFloat(curSizes.chest);
    const curBiceps = loggedBiceps !== null ? loggedBiceps : parseFloat(curSizes.biceps);
    
    const f7Waist = parseFloat(sizes7.waist);
    const f7Chest = parseFloat(sizes7.chest);
    const f7Biceps = parseFloat(sizes7.biceps);
    
    const f30Waist = parseFloat(sizes30.waist);
    const f30Chest = parseFloat(sizes30.chest);
    const f30Biceps = parseFloat(sizes30.biceps);
    
    formatProjText(el.proj7Waist, f7Waist - curWaist, 'waist', f7Waist, 'cm', curWaist);
    formatProjText(el.proj7Chest, f7Chest - curChest, 'chest', f7Chest, 'cm', curChest);
    formatProjText(el.proj7Biceps, f7Biceps - curBiceps, 'biceps', f7Biceps, 'cm', curBiceps);
    
    formatProjText(el.proj30Waist, f30Waist - curWaist, 'waist', f30Waist, 'cm', curWaist);
    formatProjText(el.proj30Chest, f30Chest - curChest, 'chest', f30Chest, 'cm', curChest);
    formatProjText(el.proj30Biceps, f30Biceps - curBiceps, 'biceps', f30Biceps, 'cm', curBiceps);
    
    // Update Body Tab Detailed statistics
    el.currentDailyDeficit.textContent = `${Math.round(netDeficit)} kcal`;
    if (netDeficit > 0) {
      el.currentDailyDeficit.style.color = 'var(--accent-green)';
    } else {
      el.currentDailyDeficit.style.color = '#ef4444';
    }
    
    el.proteinTargetStatus.textContent = `${totalProtein.toFixed(1)}g / ${targetProtein}g (${hasEnoughProtein ? '已達標' : '未達標'})`;
    el.proteinTargetStatus.style.color = hasEnoughProtein ? 'var(--accent-green)' : 'var(--accent-yellow)';
    
    // Update Dynamic Projection Status UI card based on today's status
    updateDynamicProjectionStatusUI(-avgDailyBalance, hasEnoughProtein, hasWeightTraining, sum7WeightTrainingMins, avgDailyProtein, targetProtein);
  }

  function formatProjText(element, changeValue, metricType, futureValue, unit, currentValue) {
    let color = 'white';
    let arrow = '';
    
    if (changeValue < -0.01) {
      color = 'var(--accent-green)';
      arrow = ' ↓';
    } else if (changeValue > 0.01) {
      color = '#ef4444';
      arrow = ' ↑';
    }
    
    const isOneDecimal = (metricType === 'fat' || metricType === 'waist' || metricType === 'chest' || metricType === 'biceps');
    const decimalPlaces = isOneDecimal ? 1 : 2;
    
    const isPct = unit === '%';
    const spacing = isPct ? '' : ' ';
    const futureStr = futureValue.toFixed(decimalPlaces);
    const changeStr = changeValue >= 0 
      ? `+${changeValue.toFixed(decimalPlaces)}` 
      : `${changeValue.toFixed(decimalPlaces)}`;
      
    if (element) {
      element.style.color = color;
      if (currentValue !== undefined) {
        const currentStr = currentValue.toFixed(decimalPlaces);
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
  }

  function updateDynamicProjectionStatusUI(netDeficit, hasEnoughProtein, hasWeightTraining, weightTrainingMins, totalProtein, targetProtein) {
    if (!el.dynamicProjectionStatus) return;

    const p = state.profile;
    const gender = p.gender || 'male';
    const fatPercent = parseFloat(p.fatPercent) || 20;
    const height = parseFloat(p.height) || 175;
    const weight = parseFloat(p.weight) || 70;
    const bmi = weight / ((height / 100) ** 2);
    
    // Determine user's body type: 偏重 (overweight/high body fat) or 偏瘦 (underweight/skinny)
    // Overweight: body fat >= 20% (male) or >= 28% (female), or BMI >= 24
    const isOverweight = (gender === 'male' && fatPercent >= 20) || (gender === 'female' && fatPercent >= 28) || bmi >= 24;
    
    let statusClass = '';
    let emoji = '';
    let title = '';
    let description = '';
    let pathTitle = '';
    let pathDesc = '';
    let warningHtml = '';

    // Classification
    if (hasEnoughProtein) {
      if (hasWeightTraining) {
        if (netDeficit > 0) {
          // Recomposition
          statusClass = 'status-recomp';
          emoji = '🔥';
          title = '增肌減脂型 (Body Recomposition)';
          description = `您近期（過去 7 天日均）攝取了足夠的蛋白質（日均 <b>${totalProtein.toFixed(1)}g</b>，目標 ${targetProtein}g），且有進行阻力訓練（週累計 <b>${weightTrainingMins} 分鐘</b>，已達標週目標 90 分鐘），並且日均創造了 <b>${Math.round(netDeficit)} kcal</b> 的熱量赤字！這在科學上是達成「增肌與減脂同時進行」的黃金組合。`;
          if (isOverweight) {
            pathTitle = '⚖️ 偏重/高體脂體態路徑';
            pathDesc = `您的身體會優先動用體脂肪作為熱量來源，同時利用充足的蛋白質與重訓刺激修復肌肉。預期將會看到<b>體重穩健下降，身形明顯變小、變結實，線條漸趨緊緻</b>。`;
          } else {
            pathTitle = '🏃‍♂️ 偏瘦/正常體態路徑';
            pathDesc = `由於您皮下脂肪較少，此赤字會促使身體精準利用微幅熱量差，配合重訓將微量脂肪轉為肌肉能量。預期<b>體重微幅下降，肌肉圍度維持甚至增加，線條感與腹肌會更加明顯</b>。`;
          }
        } else {
          // Clean Bulk
          statusClass = 'status-clean-bulk';
          emoji = '💪';
          title = '乾淨增肌型 (Clean Bulk)';
          description = `您近期（過去 7 天日均）攝取了足夠的蛋白質（日均 <b>${totalProtein.toFixed(1)}g</b>，目標 ${targetProtein}g），且有進行阻力訓練（週累計 <b>${weightTrainingMins} 分鐘</b>，已達標週目標 90 分鐘），熱量處於平衡或盈餘狀態（日均盈餘 <b>${Math.round(Math.abs(netDeficit))} kcal</b>）。這是構建純肌肉組織最理想的生理環境。`;
          if (isOverweight) {
            pathTitle = '⚖️ 偏重/高體脂體態路徑';
            pathDesc = `由於熱量盈餘且體脂偏高，此狀態會使您的肌肉與脂肪同時緩步上升，身形會顯得更為<b>厚實與強壯</b>。但建議若以減脂為首要目標，可微調飲食將熱量降至赤字區間，以利脂肪燃燒。`;
          } else {
            pathTitle = '🏃‍♂️ 偏瘦/正常體態路徑';
            pathDesc = `這是最適合您的路徑！熱量盈餘提供充足能量，配合蛋白質與重訓，能最大化合成肌肉。您將會看到<b>體重逐步增加、骨架與肌肉圍度顯著提升，告別乾癟身形，迎來精壯體格</b>。`;
          }
        }
      } else {
        // Maintenance
        statusClass = 'status-maintenance';
        emoji = '🧘';
        title = '體態維持型 (Body Maintenance)';
        description = `您近期（過去 7 天日均）攝取了足夠的蛋白質（日均 <b>${totalProtein.toFixed(1)}g</b>，目標 ${targetProtein}g），但阻力訓練不足（週累計 <b>${weightTrainingMins} 分鐘</b>，未達週目標 90 分鐘）。雖然缺乏足夠的機械張力刺激肌肉生長，但充足的蛋白質與飲食管理能有效維持現有的瘦肉組織，避免流失。`;
        if (isOverweight) {
          pathTitle = '⚖️ 偏重/高體脂體態路徑';
          pathDesc = `沒有重量訓練的破壞與重建，身體不會啟動肌肉生長機制。在熱量平衡或微幅波動下，您的<b>體重與身形不會有明顯變化</b>，體脂也難以顯著下降。建議加入每週至少 3 次阻力訓練。`;
        } else {
          pathTitle = '🏃‍♂️ 偏瘦/正常體態路徑';
          pathDesc = `充足蛋白質能保障現有肌肉，但缺乏阻力訓練刺激，肌肉無法增長。您將維持<b>偏瘦且肉質偏軟的狀態，身形線條與飽滿度不會有明顯改變</b>。`;
        }
      }
    } else {
      if (netDeficit > 0) {
        // Muscle Loss
        statusClass = 'status-muscle-loss';
        emoji = '⚠️';
        title = '肌肉流失型 (Muscle Loss / Skinny Fat)';
        description = `您近期（過去 7 天日均）創造了 <b>${Math.round(netDeficit)} kcal</b> 的日均熱量赤字，但蛋白質攝取不足（日均僅 <b>${totalProtein.toFixed(1)}g</b>，未達目標的 80% 即 ${Math.round(targetProtein * 0.8)}g）。在熱量不足且缺乏原料（蛋白質）的情況下，身體會被迫分解肌肉組織來供能，形成所謂的「節食流失肌肉」。`;
        warningHtml = `<div class="warning-li" style="color: #ef4444; font-size: 11px; margin-top: 8px; font-weight: bold;">※ 警告：流失體重的 <b>35%</b> 均為寶貴的肌肉！</div>`;
        if (isOverweight) {
          pathTitle = '⚖️ 偏重/高體脂體態路徑';
          pathDesc = `雖然體重會下降，但流失的多為珍貴的肌肉與水分，體脂率反而可能持平或上升。這會使您<b>肉質更加鬆軟、代謝率下降，比例上看起來依然臃腫，更容易遇到減重平台期</b>。`;
        } else {
          pathTitle = '🏃‍♂️ 偏瘦/正常體態路徑';
          pathDesc = `這將導致嚴重的「泡芙人 (Skinny Fat)」危機。您的**體重會持續下降、鎖骨突出，但身形顯得乾癟、無精神且毫無線條感**，稍微多吃就極易囤積脂肪在腹部。`;
        }
      } else {
        // Fat Gain
        statusClass = 'status-fat-gain';
        emoji = '📈';
        title = '脂肪囤積型 (Fat Accumulation)';
        description = `您近期（過去 7 天日均）熱量處於平衡或盈餘狀態（日均盈餘 <b>${Math.round(Math.abs(netDeficit))} kcal</b>），且蛋白質攝取不足（日均僅 <b>${totalProtein.toFixed(1)}g</b>），同時也缺乏重訓。在沒有運動刺激、沒有充足蛋白質、卻有熱量多餘的情況下，多餘的熱量將全部以脂肪形式儲存。`;
        if (isOverweight) {
          pathTitle = '⚖️ 偏重/高體脂體態路徑';
          pathDesc = `這是需要特別警惕的狀態。多餘的熱量會快速轉化為脂肪，堆積在腹部、臀部與大腿等脂肪易囤積部位，導致**體重快速上升，身形明顯橫向發展，體脂率攀升**。`;
        } else {
          pathTitle = '🏃‍♂️ 偏瘦/正常體態路徑';
          pathDesc = `熱量盈餘但缺乏肌肉刺激，多餘熱量只會變成脂肪。您會發現**體重增加，但肉全部長在肚子上，形成「四肢細瘦、肚子大」的青蛙體態**，體脂率迅速上升。`;
        }
      }
    }

    el.dynamicProjectionStatus.innerHTML = `
      <div class="active-scenario-box ${statusClass}">
        <div class="active-scenario-header">
          <div class="active-scenario-indicator-dot"></div>
          <span class="active-scenario-title">${emoji} ${title}</span>
        </div>
        <div class="active-scenario-desc">
          ${description}
          ${warningHtml}
        </div>
        <div class="active-path-card">
          <div class="path-badge">${pathTitle}</div>
          <div class="path-text">${pathDesc}</div>
        </div>
      </div>
    `;
  }

  // --- BODY PRESETS DEFINITIONS FOR MALE & FEMALE 1-9 MATRIX ---
  const BODY_PRESETS = {
    male: [
      { id: 1, name: "消瘦塑形 (10-12%)", muscleRatio: 0.82, fatPercent: 11, label: "10-12%" },
      { id: 2, name: "精實線條 (12-15%)", muscleRatio: 0.98, fatPercent: 13.5, label: "12-15%" },
      { id: 3, name: "微肌健美 (15-17%)", muscleRatio: 1.00, fatPercent: 16, label: "15-17%" },
      { id: 4, name: "勻稱標準 (17-19%)", muscleRatio: 1.00, fatPercent: 18, label: "17-19%" },
      { id: 5, name: "標準飽滿 (19-21%)", muscleRatio: 0.98, fatPercent: 20, label: "19-21%" },
      { id: 6, name: "平坦無肌 (21-23%)", muscleRatio: 0.92, fatPercent: 22, label: "21-23%" },
      { id: 7, name: "微寬體態 (23-25%)", muscleRatio: 0.90, fatPercent: 24, label: "23-25%" },
      { id: 8, name: "偏肉身形 (25-27%)", muscleRatio: 0.88, fatPercent: 26, label: "25-27%" },
      { id: 9, name: "厚重有肉 (27-30%)", muscleRatio: 0.86, fatPercent: 28.5, label: "27-30%" }
    ],
    female: [
      { id: 1, name: "極度消瘦 (纖細)", muscleRatio: 0.75, fatPercent: 15, label: "骨感" },
      { id: 2, name: "偏瘦無肌 (苗條)", muscleRatio: 0.82, fatPercent: 18.5, label: "苗條" },
      { id: 3, name: "陽光薄肌 (緊緻)", muscleRatio: 0.98, fatPercent: 16.5, label: "馬甲線" },
      { id: 4, name: "標準精實 (勻稱)", muscleRatio: 1.05, fatPercent: 21.5, label: "運動健美" },
      { id: 5, name: "結實壯碩 (健麗)", muscleRatio: 1.20, fatPercent: 22.5, label: "力量塑形" },
      { id: 6, name: "健美健雅 (模特)", muscleRatio: 1.35, fatPercent: 14.5, label: "健美體態" },
      { id: 7, name: "重裝厚實 (豐滿)", muscleRatio: 1.30, fatPercent: 24.5, label: "厚實" },
      { id: 8, name: "豐滿曲線 (沙漏)", muscleRatio: 1.15, fatPercent: 28, label: "歐美風" },
      { id: 9, name: "豐滿肉感 (微胖)", muscleRatio: 0.90, fatPercent: 33, label: "肉肉型" }
    ]
  };

  // Distance helper to find closest body preset to current stats
  function getClosestPresetIndex(gender, userMuscleRatio, userFatPercent) {
    const presets = BODY_PRESETS[gender] || BODY_PRESETS.male;
    let minDistance = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < presets.length; i++) {
      const p = presets[i];
      // Scale muscle ratio difference by 20 to balance fat percent difference scale
      const dMuscle = (userMuscleRatio - p.muscleRatio) * 20;
      const dFat = userFatPercent - p.fatPercent;
      const distance = dMuscle * dMuscle + dFat * dFat;
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  // --- Dynamic Body Shape Visualizer (Sci-Fi Scanner style) ---
  function drawBodyShapeAvatar(gender, weight, height, muscle, fatPercent) {
    if (!window.bodyAvatarPreviewMode) {
      window.bodyAvatarState = { gender, weight, height, muscle, fatPercent };
    }
    
    // Bind preview badge click event once on initialization
    if (!window.bodyAvatarInitialized) {
      window.bodyAvatarInitialized = true;
      window.bodyAvatarViewMode = 'sprite'; // only sprite mode
      window.bodyAvatarPreviewMode = false;
      
      if (el.avatarPreviewBadge) {
        el.avatarPreviewBadge.addEventListener('click', () => {
          resetBodyAvatarPreview();
        });
      }

      // Lightbox modal toggle event listeners
      const viewportEl = document.getElementById('avatar-viewport');
      const lightboxEl = document.getElementById('body-shape-lightbox');
      const closeLbBtn = document.getElementById('btn-close-lightbox');
      const closeLbFooterBtn = document.getElementById('lightbox-btn-close');
      
      if (viewportEl && lightboxEl) {
        viewportEl.addEventListener('click', () => {
          // Open lightbox
          lightboxEl.classList.add('active');
          
          // Populate subtitle
          const lbSubtitle = document.getElementById('lightbox-subtitle');
          if (lbSubtitle && window.bodyAvatarState) {
            const stateText = window.bodyAvatarState.weight.toFixed(1) + ' kg / ' + window.bodyAvatarState.fatPercent.toFixed(1) + '% 體脂';
            lbSubtitle.textContent = stateText;
          }
          
          // Initialize Lightbox Preview State and Sliders
          if (window.bodyAvatarState) {
            const heightM = window.bodyAvatarState.height / 100;
            const stdMuscleBase = heightM * heightM * 22 * 0.4;
            const initialMuscleRatio = window.bodyAvatarState.muscle / (stdMuscleBase || 28);
            
            window.lightboxPreviewState = {
              gender: window.bodyAvatarState.gender,
              height: window.bodyAvatarState.height,
              weight: window.bodyAvatarState.weight,
              fatPercent: window.bodyAvatarState.fatPercent,
              muscleRatio: initialMuscleRatio,
              muscle: window.bodyAvatarState.muscle
            };
            
            const sliderFat = document.getElementById('lightbox-slider-fat');
            const sliderMuscle = document.getElementById('lightbox-slider-muscle');
            const fatValDisp = document.getElementById('lightbox-fat-val');
            const muscleValDisp = document.getElementById('lightbox-muscle-val');
            
            if (sliderFat) sliderFat.value = window.lightboxPreviewState.fatPercent;
            if (sliderMuscle) sliderMuscle.value = window.lightboxPreviewState.muscleRatio;
            if (fatValDisp) fatValDisp.textContent = window.lightboxPreviewState.fatPercent.toFixed(1) + ' %';
            if (muscleValDisp) muscleValDisp.textContent = window.lightboxPreviewState.muscleRatio.toFixed(2);
          }
        });
      }
      
      // Bind Lightbox Slider & Reset Listeners once on init
      const sliderFat = document.getElementById('lightbox-slider-fat');
      const sliderMuscle = document.getElementById('lightbox-slider-muscle');
      const btnResetLb = document.getElementById('lightbox-btn-reset');
      
      if (sliderFat) {
        sliderFat.addEventListener('input', function() {
          if (window.lightboxPreviewState) {
            window.lightboxPreviewState.fatPercent = parseFloat(this.value);
            const fatValDisp = document.getElementById('lightbox-fat-val');
            if (fatValDisp) fatValDisp.textContent = window.lightboxPreviewState.fatPercent.toFixed(1) + ' %';
          }
        });
      }
      
      if (sliderMuscle) {
        sliderMuscle.addEventListener('input', function() {
          if (window.lightboxPreviewState) {
            window.lightboxPreviewState.muscleRatio = parseFloat(this.value);
            const heightM = window.lightboxPreviewState.height / 100;
            const stdMuscleBase = heightM * heightM * 22 * 0.4;
            window.lightboxPreviewState.muscle = window.lightboxPreviewState.muscleRatio * (stdMuscleBase || 28);
            const muscleValDisp = document.getElementById('lightbox-muscle-val');
            if (muscleValDisp) muscleValDisp.textContent = window.lightboxPreviewState.muscleRatio.toFixed(2);
          }
        });
      }
      
      if (btnResetLb) {
        btnResetLb.addEventListener('click', () => {
          if (window.bodyAvatarState && window.lightboxPreviewState) {
            const heightM = window.bodyAvatarState.height / 100;
            const stdMuscleBase = heightM * heightM * 22 * 0.4;
            const initialMuscleRatio = window.bodyAvatarState.muscle / (stdMuscleBase || 28);
            
            window.lightboxPreviewState.fatPercent = window.bodyAvatarState.fatPercent;
            window.lightboxPreviewState.muscleRatio = initialMuscleRatio;
            window.lightboxPreviewState.muscle = window.bodyAvatarState.muscle;
            
            const sliderFat = document.getElementById('lightbox-slider-fat');
            const sliderMuscle = document.getElementById('lightbox-slider-muscle');
            const fatValDisp = document.getElementById('lightbox-fat-val');
            const muscleValDisp = document.getElementById('lightbox-muscle-val');
            
            if (sliderFat) sliderFat.value = window.lightboxPreviewState.fatPercent;
            if (sliderMuscle) sliderMuscle.value = window.lightboxPreviewState.muscleRatio;
            if (fatValDisp) fatValDisp.textContent = window.lightboxPreviewState.fatPercent.toFixed(1) + ' %';
            if (muscleValDisp) muscleValDisp.textContent = window.lightboxPreviewState.muscleRatio.toFixed(2);
          }
        });
      }
      
      function closeLightbox() {
        if (lightboxEl) lightboxEl.classList.remove('active');
      }
      
      if (closeLbBtn) closeLbBtn.addEventListener('click', closeLightbox);
      if (closeLbFooterBtn) closeLbFooterBtn.addEventListener('click', closeLightbox);
      if (lightboxEl) {
        lightboxEl.addEventListener('click', (e) => {
          if (e.target === lightboxEl) closeLightbox();
        });
      }
    }
    
    if (!window.bodyAvatarAnimId) {
      function render() {
        const spriteEl = document.getElementById('body-shape-sprite');
        if (!spriteEl) {
          window.bodyAvatarAnimId = null;
          return;
        }
        if (window.bodyAvatarState) {
          // Draw real body image sprite with dynamic dual-layer blending and micro-morphing
          updateSpriteView(window.bodyAvatarState, false);
          
          // Draw scrolling laser scanner line overlay
          const spriteScanlineCanvas = document.getElementById('sprite-scanline-canvas');
          if (spriteScanlineCanvas) {
            drawSpriteScanlineFrame(spriteScanlineCanvas, window.bodyAvatarState);
          }

          // Draw to lightbox elements if active
          const lightboxEl = document.getElementById('body-shape-lightbox');
          if (lightboxEl && lightboxEl.classList.contains('active')) {
            const lbSprite = document.getElementById('lightbox-body-sprite');
            const lbScanline = document.getElementById('lightbox-sprite-scanline');
            const targetState = window.lightboxPreviewState || window.bodyAvatarState;
            if (lbSprite) {
              updateSpriteView(targetState, true);
            }
            if (lbScanline) {
              drawSpriteScanlineFrame(lbScanline, targetState);
            }
          }
        }

        // Increment scan line scroll coordinate dynamically
        if (window.bodyAvatarScanY === undefined) {
          window.bodyAvatarScanY = 30;
        } else {
          window.bodyAvatarScanY += 1.5;
          if (window.bodyAvatarScanY > 210) {
            window.bodyAvatarScanY = 15;
          }
        }

        window.bodyAvatarAnimId = requestAnimationFrame(render);
      }
      window.bodyAvatarAnimId = requestAnimationFrame(render);
    }
  }

  function drawBodyShapeFrame(avatarState, canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { gender, weight, height, muscle, fatPercent } = avatarState;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate size scaling parameters
    const scaleX = canvas.width / 160;
    const scaleYBase = canvas.height / 220;
    const centerX = canvas.width / 2;
    const isThumbnail = canvas.width < 100;
    
    // Custom user profile detection (179cm, 79kg, 23% body fat, flat belly, skinny limbs)
    const isCustomProfile = gender === 'male' && 
                            !window.bodyAvatarPreviewMode &&
                            (height >= 177 && height <= 181) &&
                            (fatPercent >= 21.5 && fatPercent <= 24.5);
    
    // Calculate biometric ratios
    const heightM = height / 100;
    const stdMuscleBase = heightM * heightM * 22 * 0.4;
    const muscleRatio = muscle / (stdMuscleBase || 28);
    const fatRatio = fatPercent / (gender === 'male' ? 18 : 25);
    
    // Clamp ratios to avoid extreme distortion
    const cMuscle = Math.max(0.75, Math.min(1.45, muscleRatio));
    // If custom profile, restrict fat waist bulge to keep it flat
    const cFat = isCustomProfile ? 1.05 : Math.max(0.7, Math.min(2.5, fatRatio));
    
    // Custom slim limbs factor (skinny limbs for male/user, normal for matrix)
    const limbScale = (gender === 'male') ? (isCustomProfile ? 0.74 : 0.82) : 0.95;
    
    // Dynamic width scaling based on muscle & fat ratios (scaled by scaleX and limbScale)
    const shoulderWidth = (gender === 'male' ? 52 : 40) * cMuscle * scaleX;
    const chestWidth = (gender === 'male' ? 46 : 38) * cMuscle * scaleX;
    const waistWidth = (gender === 'male' ? 28 : 24) * cFat * scaleX;
    const hipsWidth = (gender === 'male' ? 32 : 42) * (gender === 'male' ? (cMuscle * 0.3 + cFat * 0.7) : cFat) * scaleX;
    const armThickness = (gender === 'male' ? 10 : 8) * (cMuscle * 0.75 + cFat * 0.25) * limbScale * scaleX;
    const neckWidth = (gender === 'male' ? 10 : 8) * (cMuscle * 0.5 + cFat * 0.5) * scaleX;
    
    // Height scaling (Baseline standard: 175cm)
    const heightScale = Math.max(0.85, Math.min(1.15, height / 175));
    function scaleY(y) {
      return (110 + (y - 110) * heightScale) * scaleYBase;
    }
    
    // 1. Draw Grid Background for sci-fi look (skipped for matrix thumbnails)
    if (!isThumbnail) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      // Vertical grid lines
      for (let x = 20; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 20; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Height limit indicators (sci-fi markers)
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.beginPath();
      ctx.moveTo(10, scaleY(205));
      ctx.lineTo(150, scaleY(205));
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(10, scaleY(13));
      ctx.lineTo(150, scaleY(13));
      ctx.stroke();
    }

    // 2. Draw Body Shape Silhouette (Torso, Arms, Legs in one path)
    ctx.beginPath();
    
    // Start at Neck Left
    ctx.moveTo(centerX - neckWidth / 2, scaleY(40));
    
    // Shoulder Left
    ctx.lineTo(centerX - shoulderWidth / 2, scaleY(48));
    
    // Outer Arm Left
    ctx.quadraticCurveTo(centerX - shoulderWidth / 2 - armThickness, scaleY(90), centerX - shoulderWidth / 2 - armThickness * 0.7, scaleY(130));
    ctx.quadraticCurveTo(centerX - shoulderWidth / 2 - armThickness * 0.5, scaleY(138), centerX - shoulderWidth / 2 - armThickness * 0.5, scaleY(140));
    
    // Inner Arm Left (to armpit)
    ctx.quadraticCurveTo(centerX - shoulderWidth / 2 + armThickness * 0.2, scaleY(130), centerX - shoulderWidth / 2 + armThickness * 0.4, scaleY(90));
    ctx.quadraticCurveTo(centerX - chestWidth / 2, scaleY(72), centerX - chestWidth / 2, scaleY(72));
    
    // Torso Left (Chest -> Waist -> Hips)
    ctx.quadraticCurveTo(centerX - waistWidth / 2, scaleY(100), centerX - hipsWidth / 2, scaleY(125));
    
    // Outer Leg Left (made thinner by dividing by leg factor)
    const legOuterFactor = (gender === 'male') ? 2.6 : 2.2;
    const legInnerFactor = (gender === 'male') ? 5.2 : 5.8;
    
    ctx.quadraticCurveTo(centerX - hipsWidth / (legOuterFactor * 0.9), scaleY(165), centerX - hipsWidth / legOuterFactor, scaleY(200));
    
    // Left Foot Bottom
    ctx.quadraticCurveTo(centerX - hipsWidth / legOuterFactor - 4 * scaleX, scaleY(205), centerX - hipsWidth / legOuterFactor - 4 * scaleX, scaleY(205));
    ctx.lineTo(centerX - hipsWidth / legInnerFactor, scaleY(205));
    
    // Inner Leg Left -> Crotch
    ctx.lineTo(centerX - hipsWidth / legInnerFactor, scaleY(165));
    ctx.lineTo(centerX, scaleY(135));
    
    // Inner Leg Right
    ctx.lineTo(centerX + hipsWidth / legInnerFactor, scaleY(165));
    ctx.lineTo(centerX + hipsWidth / legInnerFactor, scaleY(205));
    
    // Right Foot Bottom
    ctx.lineTo(centerX + hipsWidth / legOuterFactor + 4 * scaleX, scaleY(205));
    ctx.quadraticCurveTo(centerX + hipsWidth / legOuterFactor + 4 * scaleX, scaleY(205), centerX + hipsWidth / legOuterFactor, scaleY(200));
    
    // Outer Leg Right
    ctx.quadraticCurveTo(centerX + hipsWidth / (legOuterFactor * 0.9), scaleY(165), centerX + hipsWidth / legOuterFactor, scaleY(125));
    
    // Torso Right (Hips -> Waist -> Chest)
    ctx.quadraticCurveTo(centerX + waistWidth / 2, scaleY(100), centerX + chestWidth / 2, scaleY(72));
    
    // Inner Arm Right (from armpit)
    ctx.quadraticCurveTo(centerX + shoulderWidth / 2 - armThickness * 0.4, scaleY(90), centerX + shoulderWidth / 2 - armThickness * 0.2, scaleY(130));
    ctx.quadraticCurveTo(centerX + shoulderWidth / 2 + armThickness * 0.5, scaleY(138), centerX + shoulderWidth / 2 + armThickness * 0.5, scaleY(140));
    
    // Outer Arm Right
    ctx.quadraticCurveTo(centerX + shoulderWidth / 2 + armThickness * 0.7, scaleY(130), centerX + shoulderWidth / 2 + armThickness, scaleY(90));
    ctx.lineTo(centerX + shoulderWidth / 2, scaleY(48));
    
    // Neck Right
    ctx.lineTo(centerX + neckWidth / 2, scaleY(40));
    
    ctx.closePath();
    
    // Body Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (gender === 'male') {
      grad.addColorStop(0, 'rgba(168, 85, 247, 0.1)'); // Purple
      grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)'); // Violet
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.3)'); // Blue
    } else {
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.1)'); // Pink
      grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)'); // Hot Pink
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.3)'); // Purple
    }
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Body Neon Stroke Glow
    ctx.shadowBlur = isThumbnail ? 3 : 10;
    ctx.shadowColor = gender === 'male' ? 'rgba(139, 92, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)';
    ctx.strokeStyle = gender === 'male' ? 'rgba(147, 51, 234, 0.7)' : 'rgba(219, 39, 119, 0.7)';
    ctx.lineWidth = isThumbnail ? 1 : 1.5;
    ctx.stroke();
    
    // Draw Head separately
    ctx.beginPath();
    ctx.ellipse(centerX, scaleY(26), 9 * scaleX, 12 * heightScale * scaleYBase, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.stroke();

    // Reset shadow for internal detail drawing
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // 3. Dynamic Muscle Definition Lines (Low Fat = high visibility; High Fat = invisible)
    let muscleAlpha = (23 - fatPercent) / 13;
    muscleAlpha = Math.max(0, Math.min(0.9, muscleAlpha)) * Math.max(0.7, Math.min(1.3, muscleRatio));
    
    // Force hide abs/muscle definitions for custom profile (肚子平坦，看不出腹肌)
    if (isCustomProfile) {
      muscleAlpha = 0;
    }
    
    if (muscleAlpha > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${muscleAlpha * (isThumbnail ? 0.25 : 0.45)})`;
      ctx.lineWidth = isThumbnail ? 0.7 : 1;
      
      if (gender === 'male') {
        // Center Chest line
        ctx.beginPath();
        ctx.moveTo(centerX, scaleY(62));
        ctx.lineTo(centerX, scaleY(78));
        ctx.stroke();
        
        // Left Chest Plate
        ctx.beginPath();
        ctx.moveTo(centerX, scaleY(78));
        ctx.quadraticCurveTo(centerX - chestWidth * 0.25, scaleY(78), centerX - chestWidth * 0.42, scaleY(74));
        ctx.stroke();
        
        // Right Chest Plate
        ctx.beginPath();
        ctx.moveTo(centerX, scaleY(78));
        ctx.quadraticCurveTo(centerX + chestWidth * 0.25, scaleY(78), centerX + chestWidth * 0.42, scaleY(74));
        ctx.stroke();
        
        // Abs vertical midline
        ctx.beginPath();
        ctx.moveTo(centerX, scaleY(82));
        ctx.lineTo(centerX, scaleY(114));
        ctx.stroke();
        
        // Abs horizontal segments
        // Row 1
        ctx.beginPath();
        ctx.moveTo(centerX - waistWidth * 0.22, scaleY(90));
        ctx.lineTo(centerX + waistWidth * 0.22, scaleY(90));
        ctx.stroke();
        
        // Row 2
        ctx.beginPath();
        ctx.moveTo(centerX - waistWidth * 0.22, scaleY(98));
        ctx.lineTo(centerX + waistWidth * 0.22, scaleY(98));
        ctx.stroke();
        
        // Row 3
        ctx.beginPath();
        ctx.moveTo(centerX - waistWidth * 0.18, scaleY(106));
        ctx.lineTo(centerX + waistWidth * 0.18, scaleY(106));
        ctx.stroke();
      } else {
        // Female Cleavage line
        ctx.beginPath();
        ctx.moveTo(centerX, scaleY(66));
        ctx.quadraticCurveTo(centerX - 4 * scaleX, scaleY(73), centerX - 12 * scaleX, scaleY(73));
        ctx.moveTo(centerX, scaleY(66));
        ctx.quadraticCurveTo(centerX + 4 * scaleX, scaleY(73), centerX + 12 * scaleX, scaleY(73));
        ctx.stroke();

        // Female 11-line Abs
        ctx.beginPath();
        ctx.moveTo(centerX - waistWidth * 0.11, scaleY(82));
        ctx.quadraticCurveTo(centerX - waistWidth * 0.09, scaleY(98), centerX - waistWidth * 0.07, scaleY(112));
        ctx.moveTo(centerX + waistWidth * 0.11, scaleY(82));
        ctx.quadraticCurveTo(centerX + waistWidth * 0.09, scaleY(98), centerX + waistWidth * 0.07, scaleY(112));
        ctx.stroke();
      }
      
      // Inguinal creases (Mermaid lines, present in both genders)
      ctx.beginPath();
      ctx.moveTo(centerX - waistWidth * 0.32, scaleY(114));
      ctx.quadraticCurveTo(centerX - waistWidth * 0.15, scaleY(124), centerX - 4 * scaleX, scaleY(127));
      ctx.moveTo(centerX + waistWidth * 0.32, scaleY(114));
      ctx.quadraticCurveTo(centerX + waistWidth * 0.15, scaleY(124), centerX + 4 * scaleX, scaleY(127));
      ctx.stroke();
    }
    
    // 4. Soft Belly Volume Shading for high fat percentage (skipped for custom flat belly profile)
    let bellyAlpha = 0;
    if (!isCustomProfile) {
      if (gender === 'male') {
        if (fatPercent > 16) bellyAlpha = (fatPercent - 16) / 12;
      } else {
        if (fatPercent > 22) bellyAlpha = (fatPercent - 22) / 12;
      }
      bellyAlpha = Math.max(0, Math.min(0.7, bellyAlpha));
    }
    
    if (bellyAlpha > 0) {
      const bellyRadGrad = ctx.createRadialGradient(centerX, scaleY(105), 2 * scaleX, centerX, scaleY(105), waistWidth * 0.4);
      bellyRadGrad.addColorStop(0, `rgba(255, 255, 255, ${bellyAlpha * 0.15})`);
      bellyRadGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bellyRadGrad;
      ctx.beginPath();
      ctx.arc(centerX, scaleY(105), waistWidth * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      // Belly fold contour line
      if (!isThumbnail && fatPercent > (gender === 'male' ? 23 : 29)) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${bellyAlpha * 0.25})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - waistWidth * 0.18, scaleY(108));
        ctx.quadraticCurveTo(centerX, scaleY(111), centerX + waistWidth * 0.18, scaleY(108));
        ctx.stroke();
      }
    }
    
    // Draw soft fat chest contours for higher fat males (without defined pectoral plate)
    if (gender === 'male' && fatPercent > 22 && !isThumbnail) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${isCustomProfile ? 0.12 : 0.25})`;
      ctx.lineWidth = 1;
      
      // Left soft breast fat curve
      ctx.beginPath();
      ctx.moveTo(centerX, scaleY(76));
      ctx.quadraticCurveTo(centerX - chestWidth * 0.2, scaleY(80), centerX - chestWidth * 0.4, scaleY(76));
      ctx.stroke();
      
      // Right soft breast fat curve
      ctx.beginPath();
      ctx.moveTo(centerX, scaleY(76));
      ctx.quadraticCurveTo(centerX + chestWidth * 0.2, scaleY(80), centerX + chestWidth * 0.4, scaleY(76));
      ctx.stroke();
    }
    
    // 5. Dynamic Scrolling Laser Scanline (skipped for matrix thumbnails)
    if (!isThumbnail) {
      if (window.bodyAvatarScanY === undefined) {
        window.bodyAvatarScanY = 30;
      }
      
      const scaledScanY = (window.bodyAvatarScanY / 220) * canvas.height;
      const startX = canvas.width * 0.125; // 20 for 160
      const endX = canvas.width * 0.875;   // 140 for 160
      const width = endX - startX;
      
      // Neon laser line
      const laserGrad = ctx.createLinearGradient(startX, 0, endX, 0);
      laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      laserGrad.addColorStop(0.3, 'rgba(16, 185, 129, 0.4)');
      laserGrad.addColorStop(0.5, 'rgba(52, 211, 153, 1)');
      laserGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.4)');
      laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      
      ctx.strokeStyle = laserGrad;
      ctx.lineWidth = canvas.width < 200 ? 2 : 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
      
      ctx.beginPath();
      ctx.moveTo(startX, scaledScanY);
      ctx.lineTo(endX, scaledScanY);
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      const laserGlow = ctx.createLinearGradient(0, scaledScanY - 5, 0, scaledScanY + 5);
      laserGlow.addColorStop(0, 'rgba(16, 185, 129, 0)');
      laserGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
      laserGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = laserGlow;
      ctx.fillRect(startX, scaledScanY - 5, width, 10);
    }
  }

  // Draw scrolling scanner overlay on top of the Threads photo
  function drawSpriteScanlineFrame(canvas, avatarState) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const heightScale = Math.max(0.85, Math.min(1.15, (avatarState.height || 175) / 175));
    function scaleY(y) {
      return (110 + (y - 110) * heightScale) * (canvas.height / 220);
    }
    
    if (window.bodyAvatarScanY === undefined) {
      window.bodyAvatarScanY = 30;
    }
    
    const scaledScanY = (window.bodyAvatarScanY / 220) * canvas.height;
    const startX = canvas.width * 0.09;
    const endX = canvas.width * 0.91;
    const width = endX - startX;
    
    // Laser Beam Line
    const laserGrad = ctx.createLinearGradient(startX, 0, endX, 0);
    laserGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    laserGrad.addColorStop(0.3, 'rgba(16, 185, 129, 0.4)');
    laserGrad.addColorStop(0.5, 'rgba(52, 211, 153, 1)');
    laserGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.4)');
    laserGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    ctx.strokeStyle = laserGrad;
    ctx.lineWidth = canvas.width < 200 ? 2.5 : 3.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
    
    ctx.beginPath();
    ctx.moveTo(startX, scaledScanY);
    ctx.lineTo(endX, scaledScanY);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // Laser Beam Glow Block
    const laserGlow = ctx.createLinearGradient(0, scaledScanY - 6, 0, scaledScanY + 6);
    laserGlow.addColorStop(0, 'rgba(16, 185, 129, 0)');
    laserGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
    laserGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = laserGlow;
    ctx.fillRect(startX, scaledScanY - 6, width, 12);
  }

  // Update Threads photo cropped view with micro-morphing dimensions
  function updateSpriteView(avatarState, isLightbox = false) {
    const spriteDiv = isLightbox 
      ? document.getElementById('lightbox-body-sprite') 
      : (el.bodyShapeSprite || document.getElementById('body-shape-sprite'));
    if (!spriteDiv) return;
    
    const { gender, height, muscle, fatPercent } = avatarState;
    
    const heightM = height / 100;
    const stdMuscleBase = heightM * heightM * 22 * 0.4;
    const muscleRatio = muscle / (stdMuscleBase || 28);
    
    const closestIdx = getClosestPresetIndex(gender, muscleRatio, fatPercent);
    const presets = BODY_PRESETS[gender] || BODY_PRESETS.male;
    const preset = presets[closestIdx];
    
    const fatDiff = fatPercent - preset.fatPercent;
    const muscleDiff = muscleRatio - preset.muscleRatio;
    
    const fatScaleX = fatDiff * 0.012;
    const muscleScaleX = muscleDiff * 0.15;
    const scaleX = Math.max(0.9, Math.min(1.1, 1 + fatScaleX - muscleScaleX));
    const heightScale = Math.max(0.9, Math.min(1.1, height / 175));
    
    spriteDiv.style.transform = `scale(${scaleX}, ${heightScale})`;
    
    const col = closestIdx % 3;
    const row = Math.floor(closestIdx / 3);
    
    if (gender === 'male') {
      spriteDiv.style.backgroundImage = "url('./male_body_shapes_10_30_grid.png')";
    } else {
      spriteDiv.style.backgroundImage = "url('./female_body_shapes.png')";
    }
    spriteDiv.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
    spriteDiv.style.backgroundSize = "300% 300%";
    spriteDiv.style.opacity = "1.0";
  }

  // Render 3x3 Grid Matrix thumbnails dynamically using CSS sprite sheets
  function renderBodyShapeMatrix(gender, height, userMuscleRatio, userFatPercent) {
    const grid = el.bodyMatrixGrid || document.getElementById('body-matrix-grid');
    if (!grid) return;
    
    const closestIdx = getClosestPresetIndex(gender, userMuscleRatio, userFatPercent);
    const presets = BODY_PRESETS[gender] || BODY_PRESETS.male;
    
    const existingCells = grid.querySelectorAll('.matrix-cell');
    const needRebuild = existingCells.length !== 9 || grid.dataset.gender !== gender;
    
    if (needRebuild) {
      grid.innerHTML = '';
      grid.dataset.gender = gender;
      
      presets.forEach((p, idx) => {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.dataset.index = idx;
        
        if (window.bodyAvatarPreviewMode && window.bodyAvatarPreviewIndex === idx) {
          cell.classList.add('active-preset');
        }
        if (idx === closestIdx) {
          cell.classList.add('closest-preset');
        }
        
        // Define cropped thumbnail styling (both are 3x3 grids)
        const isMale = gender === 'male';
        const imgUrl = isMale ? './male_body_shapes_10_30_grid.png' : './female_body_shapes.png';
        const bgSize = '300% 300%';
        
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const bgPos = `${col * 50}% ${row * 50}%`;
        
        cell.innerHTML = `
          <span class="num-label">#${idx + 1} ${p.label}</span>
          <div class="matrix-thumbnail" style="width: 48px; height: 68px; background-image: url('${imgUrl}'); background-repeat: no-repeat; background-size: ${bgSize}; background-position: ${bgPos}; border-radius: 6px; margin: 4px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);"></div>
          <span class="name-label">${p.name.split(' (')[0]}</span>
          <span class="stats-label">脂: ${p.fatPercent}%</span>
        `;
        
        cell.addEventListener('click', () => {
          triggerBodyAvatarPreview(idx);
        });
        
        grid.appendChild(cell);
      });
    } else {
      existingCells.forEach((cell, idx) => {
        cell.classList.remove('closest-preset', 'active-preset');
        
        if (idx === closestIdx) {
          cell.classList.add('closest-preset');
        }
        if (window.bodyAvatarPreviewMode && window.bodyAvatarPreviewIndex === idx) {
          cell.classList.add('active-preset');
        }
      });
    }
  }

  // Trigger grid cell preview
  function triggerBodyAvatarPreview(index) {
    const gender = state.profile.gender || 'male';
    const height = parseFloat(state.profile.height) || 175;
    const presets = BODY_PRESETS[gender] || BODY_PRESETS.male;
    const p = presets[index];
    
    window.bodyAvatarPreviewMode = true;
    window.bodyAvatarPreviewIndex = index;
    
    const stdMuscleBase = (height / 100) ** 2 * 22 * 0.4;
    const previewMuscle = stdMuscleBase * p.muscleRatio;
    
    window.bodyAvatarState = {
      gender,
      weight: 70,
      height,
      muscle: previewMuscle,
      fatPercent: p.fatPercent
    };
    
    if (el.avatarPreviewBadge) {
      el.avatarPreviewBadge.style.display = 'flex';
      el.avatarPreviewBadge.querySelector('span').textContent = `⚠️ 預覽中：${p.name.split(' (')[0]}（點此還原）`;
    }
    
    const cells = document.querySelectorAll('.matrix-cell');
    cells.forEach((cell, idx) => {
      if (idx === index) {
        cell.classList.add('active-preset');
      } else {
        cell.classList.remove('active-preset');
      }
    });
    
    updateSpriteView(window.bodyAvatarState);
  }

  // Cancel preview and restore actual user stats
  function resetBodyAvatarPreview() {
    window.bodyAvatarPreviewMode = false;
    window.bodyAvatarPreviewIndex = null;
    if (el.avatarPreviewBadge) el.avatarPreviewBadge.style.display = 'none';
    
    const cells = document.querySelectorAll('.matrix-cell');
    cells.forEach(c => c.classList.remove('active-preset'));
    
    updateCumulativeBodyStateUI();
  }

  // --- Calculate Cumulative Body State based on history ---
  function calculateCumulativeBodyState(options) {
    const p = state.profile;
    
    // Find earliest actual weight, muscle, and fat percent in history to pin simulation starting points
    let initialWeight = parseFloat(p.weight) || 70;
    let initialMuscle = parseFloat(p.muscle) || 30;
    let initialFatPct = parseFloat(p.fatPercent) || 20;

    const allDatesSorted = Object.keys(state.dailyLogs).sort();
    
    // Find earliest weight log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.weight !== undefined && entry.weight !== null && entry.weight > 0) {
        initialWeight = parseFloat(entry.weight);
        break;
      }
    }

    // Find earliest muscle log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.muscle !== undefined && entry.muscle !== null && entry.muscle > 0) {
        initialMuscle = parseFloat(entry.muscle);
        break;
      }
    }

    // Find earliest fat percent log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.fatPercent !== undefined && entry.fatPercent !== null && entry.fatPercent > 0) {
        initialFatPct = parseFloat(entry.fatPercent);
        break;
      }
    }

    const tdee = calculateTdee();
    const restDays = parseInt(p.restDays) || 0;
    const trainingDays = Math.max(0, 7 - restDays);
    const targetProtein = parseFloat(p.targetProtein) || 120;
    
    // Filter only dates up to currentActiveDate
    const pastDates = allDatesSorted.filter(d => d <= currentActiveDate);
    
    let cumWeight = initialWeight;
    let cumMuscle = initialMuscle;
    let cumFatMass = initialWeight * (initialFatPct / 100);
    let totalLogsCount = 0;
    
    let lastPlotWeight = null;
    let lastPlotMuscle = null;
    let lastPlotFat = null;
    
    pastDates.forEach(date => {
      const entry = state.dailyLogs[date];
      if (!entry) return;
      
      let dayWeight = entry.weight;
      let dayMuscle = entry.muscle;
      let dayFatPercent = entry.fatPercent;

      if (options && options.ignoreActiveDateActuals && date === currentActiveDate) {
        dayWeight = undefined;
        dayMuscle = undefined;
        dayFatPercent = undefined;
      }

      const hasWorkouts = entry.workouts && entry.workouts.length > 0;
      const hasDiet = entry.diet && entry.diet.length > 0;
      const hasWeight = dayWeight !== undefined && dayWeight !== null && dayWeight > 0;
      const hasMuscle = dayMuscle !== undefined && dayMuscle !== null && dayMuscle > 0;
      const hasFat = dayFatPercent !== undefined && dayFatPercent !== null && dayFatPercent > 0;
      
      // Only process days that actually have logs
      if (!hasWorkouts && !hasDiet && !hasWeight && !hasMuscle && !hasFat) return;
      totalLogsCount++;
      
      if (hasWeight) {
        const currentFatPct = cumWeight > 0 ? (cumFatMass / cumWeight) * 100 : initialFatPct;
        cumWeight = parseFloat(dayWeight);
        if (hasFat) {
          cumFatMass = cumWeight * (parseFloat(dayFatPercent) / 100);
        } else {
          cumFatMass = cumWeight * (currentFatPct / 100);
        }
      } else {
        if (hasFat) {
          cumFatMass = cumWeight * (parseFloat(dayFatPercent) / 100);
        }
      }
      
      if (hasMuscle) {
        cumMuscle = parseFloat(dayMuscle);
      }
      
      let plotWeight = hasWeight ? parseFloat(dayWeight) : null;
      let plotMuscle = hasMuscle ? parseFloat(dayMuscle) : null;
      let plotFat = hasFat ? parseFloat(dayFatPercent) : null;
      
      if (hasWorkouts || hasDiet) {
        const dayIn = entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const dayWorkoutOut = entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const dayCalorieBalance = dayIn - (tdee + dayWorkoutOut);
        
        const dayWeightChange = dayCalorieBalance / 7700;
        
        const dayProtein = entry.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
        const hasEnoughProtein = dayProtein >= (targetProtein * 0.8);
        
        const weightTrainingMins = entry.workouts
          .filter(isWeightTraining)
          .reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
        const hasWeightTraining = weightTrainingMins >= 30;
        
        let dayMuscleChange = 0;
        if (dayCalorieBalance < 0 && !hasEnoughProtein) {
          // Low protein deficit drops muscle (35% of loss)
          dayMuscleChange = dayWeightChange * 0.35;
        } else if (hasEnoughProtein) {
          if (hasWeightTraining) {
            const avgMuscleGrowthCoeff = (trainingDays * 1.0 + restDays * 0.25) / 7;
            dayMuscleChange = (0.15 * avgMuscleGrowthCoeff) / 7;
          } else {
            dayMuscleChange = (0.15 * 0.25) / 7;
          }
        }
        
        const dayFatChange = dayWeightChange - dayMuscleChange;
        
        cumWeight += dayWeightChange;
        cumMuscle += dayMuscleChange;
        cumFatMass += dayFatChange;
      }
      
      if (plotWeight === null) plotWeight = cumWeight;
      if (plotMuscle === null) plotMuscle = cumMuscle;
      if (plotFat === null) plotFat = cumWeight > 0 ? (cumFatMass / cumWeight) * 100 : initialFatPct;
      
      lastPlotWeight = plotWeight;
      lastPlotMuscle = plotMuscle;
      lastPlotFat = plotFat;
    });
    
    const activeLog = state.dailyLogs[currentActiveDate] || {};
    const ignoreActuals = options && options.ignoreActiveDateActuals;
    const activeHasWeight = activeLog.weight !== undefined && activeLog.weight !== null && activeLog.weight > 0;
    const activeHasMuscle = activeLog.muscle !== undefined && activeLog.muscle !== null && activeLog.muscle > 0;
    const activeHasFat = activeLog.fatPercent !== undefined && activeLog.fatPercent !== null && activeLog.fatPercent > 0;

    let finalWeight = (activeHasWeight && !ignoreActuals) ? parseFloat(activeLog.weight) : cumWeight;
    let finalMuscle = (activeHasMuscle && !ignoreActuals) ? parseFloat(activeLog.muscle) : cumMuscle;
    let finalFatPercent = (activeHasFat && !ignoreActuals) ? parseFloat(activeLog.fatPercent) : (cumWeight > 0 ? (cumFatMass / cumWeight) * 100 : initialFatPct);
    
    // Clamp to logical limits
    finalWeight = Math.max(30, finalWeight);
    finalMuscle = Math.max(10, finalMuscle);
    finalFatPercent = Math.max(1, Math.min(99, finalFatPercent));
    
    return {
      weight: finalWeight,
      muscle: finalMuscle,
      fatPercent: finalFatPercent,
      totalLogsCount
    };
  }

  // --- Get Body State History Up To a Target Date ---
  function getBodyStateHistoryUpTo(maxDateStr, options) {
    const p = state.profile;
    
    // Find earliest actual weight, muscle, and fat percent in history to pin simulation starting points
    let initialWeight = parseFloat(p.weight) || 70;
    let initialMuscle = parseFloat(p.muscle) || 30;
    let initialFatPct = parseFloat(p.fatPercent) || 20;

    const allDatesSorted = Object.keys(state.dailyLogs).sort();
    
    // Find earliest weight log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.weight !== undefined && entry.weight !== null && entry.weight > 0) {
        initialWeight = parseFloat(entry.weight);
        break;
      }
    }

    // Find earliest muscle log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.muscle !== undefined && entry.muscle !== null && entry.muscle > 0) {
        initialMuscle = parseFloat(entry.muscle);
        break;
      }
    }

    // Find earliest fat percent log
    for (const d of allDatesSorted) {
      if (options && options.ignoreActiveDateActuals && d === currentActiveDate) {
        continue;
      }
      const entry = state.dailyLogs[d];
      if (entry && entry.fatPercent !== undefined && entry.fatPercent !== null && entry.fatPercent > 0) {
        initialFatPct = parseFloat(entry.fatPercent);
        break;
      }
    }

    const tdee = calculateTdee();
    const restDays = parseInt(p.restDays) || 0;
    const trainingDays = Math.max(0, 7 - restDays);
    const targetProtein = parseFloat(p.targetProtein) || 120;
    
    let cumWeight = initialWeight;
    let cumMuscle = initialMuscle;
    let cumFatMass = initialWeight * (initialFatPct / 100);
    
    const weightHistory = {}; // key: dateStr, value: weight
    const muscleHistory = {}; // key: dateStr, value: muscle
    const fatPercentHistory = {}; // key: dateStr, value: fatPercent
    const waistHistory = {};
    const chestHistory = {};
    const bicepsHistory = {};
    
    allDatesSorted.forEach(date => {
      if (date > maxDateStr) return;
      
      const entry = state.dailyLogs[date];
      if (!entry) return;
      
      let dayWeight = entry.weight;
      let dayMuscle = entry.muscle;
      let dayFatPercent = entry.fatPercent;

      if (options && options.ignoreActiveDateActuals && date === currentActiveDate) {
        dayWeight = undefined;
        dayMuscle = undefined;
        dayFatPercent = undefined;
      }

      const hasWorkouts = entry.workouts && entry.workouts.length > 0;
      const hasDiet = entry.diet && entry.diet.length > 0;
      const hasWeight = dayWeight !== undefined && dayWeight !== null && dayWeight > 0;
      const hasMuscle = dayMuscle !== undefined && dayMuscle !== null && dayMuscle > 0;
      const hasFat = dayFatPercent !== undefined && dayFatPercent !== null && dayFatPercent > 0;
      
      if (hasWeight) {
        const currentFatPct = cumWeight > 0 ? (cumFatMass / cumWeight) * 100 : initialFatPct;
        cumWeight = parseFloat(dayWeight);
        if (hasFat) {
          cumFatMass = cumWeight * (parseFloat(dayFatPercent) / 100);
        } else {
          cumFatMass = cumWeight * (currentFatPct / 100);
        }
      } else {
        if (hasFat) {
          cumFatMass = cumWeight * (parseFloat(dayFatPercent) / 100);
        }
      }
      
      if (hasMuscle) {
        cumMuscle = parseFloat(dayMuscle);
      }
      
      let plotWeight = hasWeight ? parseFloat(dayWeight) : null;
      let plotMuscle = hasMuscle ? parseFloat(dayMuscle) : null;
      let plotFat = hasFat ? parseFloat(dayFatPercent) : null;

      if (hasWorkouts || hasDiet) {
        const dayIn = entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const dayWorkoutOut = entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
        const dayCalorieBalance = dayIn - (tdee + dayWorkoutOut);
        
        const dayWeightChange = dayCalorieBalance / 7700;
        
        const dayProtein = entry.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
        const hasEnoughProtein = dayProtein >= (targetProtein * 0.8);
        
        const weightTrainingMins = entry.workouts
          .filter(isWeightTraining)
          .reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
        const hasWeightTraining = weightTrainingMins >= 30;
        
        let dayMuscleChange = 0;
        if (dayCalorieBalance < 0 && !hasEnoughProtein) {
          dayMuscleChange = dayWeightChange * 0.35;
        } else if (hasEnoughProtein) {
          if (hasWeightTraining) {
            const avgMuscleGrowthCoeff = (trainingDays * 1.0 + restDays * 0.25) / 7;
            dayMuscleChange = (0.15 * avgMuscleGrowthCoeff) / 7;
          } else {
            dayMuscleChange = (0.15 * 0.25) / 7;
          }
        }
        
        const dayFatChange = dayWeightChange - dayMuscleChange;
        
        cumWeight += dayWeightChange;
        cumMuscle += dayMuscleChange;
        cumFatMass += dayFatChange;
      }
      
      if (plotWeight === null) plotWeight = cumWeight;
      if (plotMuscle === null) plotMuscle = cumMuscle;
      if (plotFat === null) plotFat = cumWeight > 0 ? (cumFatMass / cumWeight) * 100 : initialFatPct;

      weightHistory[date] = plotWeight;
      muscleHistory[date] = plotMuscle;
      fatPercentHistory[date] = plotFat;
      
      const gender = p.gender || 'male';
      const heightVal = parseFloat(p.height) || 175;
      
      let dayWaist = entry.waist;
      let dayChest = entry.chest;
      let dayBiceps = entry.biceps;
      if (options && options.ignoreActiveDateActuals && date === currentActiveDate) {
        dayWaist = undefined;
        dayChest = undefined;
        dayBiceps = undefined;
      }
      
      let plotWaist = (dayWaist !== undefined && dayWaist !== null && parseFloat(dayWaist) > 0) ? parseFloat(dayWaist) : null;
      let plotChest = (dayChest !== undefined && dayChest !== null && parseFloat(dayChest) > 0) ? parseFloat(dayChest) : null;
      let plotBiceps = (dayBiceps !== undefined && dayBiceps !== null && parseFloat(dayBiceps) > 0) ? parseFloat(dayBiceps) : null;
      
      const baseSizes = calculateBaseBodyMeasurements(gender, heightVal, plotWeight, plotFat);
      if (plotWaist === null) plotWaist = baseSizes.waist;
      if (plotChest === null) plotChest = baseSizes.chest;
      if (plotBiceps === null) plotBiceps = baseSizes.biceps;
      
      waistHistory[date] = plotWaist;
      chestHistory[date] = plotChest;
      bicepsHistory[date] = plotBiceps;
    });
    
    return {
      weightHistory,
      muscleHistory,
      fatPercentHistory,
      waistHistory,
      chestHistory,
      bicepsHistory
    };
  }

  // --- Map Date Range to Estimated Body State Trends ---
  function getBodyStateTrendForDates(datesRange) {
    const p = state.profile;
    const initialWeight = parseFloat(p.weight) || 70;
    const initialMuscle = parseFloat(p.muscle) || 30;
    const initialFatPct = parseFloat(p.fatPercent) || 20;
    
    const history = getBodyStateHistoryUpTo(currentActiveDate);
    const weightHistory = history.weightHistory;
    const muscleHistory = history.muscleHistory;
    const fatPercentHistory = history.fatPercentHistory;
    const waistHistory = history.waistHistory;
    const chestHistory = history.chestHistory;
    const bicepsHistory = history.bicepsHistory;
    
    const sortedLoggedDates = Object.keys(weightHistory).sort();
    
    let todayWeight = initialWeight;
    if (weightHistory[currentActiveDate] !== undefined) {
      todayWeight = weightHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayWeight = weightHistory[latestDate];
    }
    
    let todayMuscle = initialMuscle;
    if (muscleHistory[currentActiveDate] !== undefined) {
      todayMuscle = muscleHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayMuscle = muscleHistory[latestDate];
    }
    
    let todayFatPct = initialFatPct;
    if (fatPercentHistory[currentActiveDate] !== undefined) {
      todayFatPct = fatPercentHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayFatPct = fatPercentHistory[latestDate];
    }
    
    let todayWaist = 0;
    if (waistHistory[currentActiveDate] !== undefined) {
      todayWaist = waistHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayWaist = waistHistory[latestDate];
    }
    
    let todayChest = 0;
    if (chestHistory[currentActiveDate] !== undefined) {
      todayChest = chestHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayChest = chestHistory[latestDate];
    }
    
    let todayBiceps = 0;
    if (bicepsHistory[currentActiveDate] !== undefined) {
      todayBiceps = bicepsHistory[currentActiveDate];
    } else if (sortedLoggedDates.length > 0) {
      let latestDate = null;
      for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
        if (sortedLoggedDates[i] <= currentActiveDate) {
          latestDate = sortedLoggedDates[i];
          break;
        }
      }
      if (latestDate) todayBiceps = bicepsHistory[latestDate];
    }
    
    const baseSizesToday = calculateBodyMeasurements(p.gender || 'male', parseFloat(p.height) || 175, todayWeight, todayFatPct);
    if (!todayWaist) todayWaist = parseFloat(baseSizesToday.waist);
    if (!todayChest) todayChest = parseFloat(baseSizesToday.chest);
    if (!todayBiceps) todayBiceps = parseFloat(baseSizesToday.biceps);
    
    // Calculate 7-day average data up to currentActiveDate for stable projections in the chart
    let sum7In = 0;
    let sum7WorkoutOut = 0;
    let sum7WorkoutMins = 0;
    let sum7Protein = 0;
    let sum7WeightTrainingMins = 0;
    let loggedDietDays = 0;
    
    const tdee = calculateTdee();
    const dActive = new Date(currentActiveDate + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(dActive);
      d.setDate(dActive.getDate() - i);
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const entry = state.dailyLogs[dateStr];
      if (entry) {
        const hasDiet = entry.diet && entry.diet.length > 0;
        if (hasDiet) {
          sum7In += entry.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
          sum7Protein += entry.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
          loggedDietDays++;
        }
        
        const dayWorkout = entry.workouts ? entry.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0) : 0;
        const dayMins = entry.workouts ? entry.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        const dayWeightTraining = entry.workouts ? entry.workouts.filter(isWeightTraining).reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0) : 0;
        
        sum7WorkoutOut += dayWorkout;
        sum7WorkoutMins += dayMins;
        sum7WeightTrainingMins += dayWeightTraining;
      }
    }
    
    const avgDailyIn = loggedDietDays > 0 ? (sum7In / loggedDietDays) : tdee;
    const avgDailyWorkoutOutRaw = sum7WorkoutOut / 7;
    const avgDailyWorkoutMins = sum7WorkoutMins / 7;
    const avgDoubleCounted = Math.round((tdee / 1440) * avgDailyWorkoutMins);
    const avgDailyWorkoutOut = Math.max(0, avgDailyWorkoutOutRaw - avgDoubleCounted);
    
    const avgDailyProtein = loggedDietDays > 0 ? (sum7Protein / loggedDietDays) : 0;
    const targetProtein = parseFloat(p.targetProtein) || 120;
    const hasEnoughProtein = avgDailyProtein >= (targetProtein * 0.8);
    const hasWeightTraining = sum7WeightTrainingMins >= 90;
    
    const avgDailyBalance = avgDailyIn - (tdee + avgDailyWorkoutOut);
    const dailyProjWeightChange = avgDailyBalance / 7700;
    
    const restDays = parseInt(p.restDays) || 0;
    const trainingDays = Math.max(0, 7 - restDays);
    
    let dailyProjMuscleChange = 0;
    if (avgDailyBalance < 0 && !hasEnoughProtein) {
      dailyProjMuscleChange = dailyProjWeightChange * 0.35;
    } else if (hasEnoughProtein) {
      if (hasWeightTraining) {
        const avgMuscleGrowthCoeff = (trainingDays * 1.0 + restDays * 0.25) / 7;
        dailyProjMuscleChange = (0.15 * avgMuscleGrowthCoeff) / 7;
      } else {
        dailyProjMuscleChange = (0.15 * 0.25) / 7;
      }
    }
    
    const dailyProjFatChange = dailyProjWeightChange - dailyProjMuscleChange;
    
    const weightTrend = [];
    const muscleTrend = [];
    const fatPercentTrend = [];
    const waistTrend = [];
    const chestTrend = [];
    const bicepsTrend = [];
    
    datesRange.forEach(date => {
      if (date <= currentActiveDate) {
        let wVal = weightHistory[date];
        let mVal = muscleHistory[date];
        let fVal = fatPercentHistory[date];
        let waistVal = waistHistory[date];
        let chestVal = chestHistory[date];
        let bicepsVal = bicepsHistory[date];
        
        if (wVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          wVal = latestDate ? weightHistory[latestDate] : initialWeight;
        }
        if (mVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          mVal = latestDate ? muscleHistory[latestDate] : initialMuscle;
        }
        if (fVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          fVal = latestDate ? fatPercentHistory[latestDate] : initialFatPct;
        }
        if (waistVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          waistVal = latestDate ? waistHistory[latestDate] : parseFloat(baseSizesToday.waist);
        }
        if (chestVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          chestVal = latestDate ? chestHistory[latestDate] : parseFloat(baseSizesToday.chest);
        }
        if (bicepsVal === undefined) {
          let latestDate = null;
          for (let i = sortedLoggedDates.length - 1; i >= 0; i--) {
            if (sortedLoggedDates[i] <= date) {
              latestDate = sortedLoggedDates[i];
              break;
            }
          }
          bicepsVal = latestDate ? bicepsHistory[latestDate] : parseFloat(baseSizesToday.biceps);
        }
        
        weightTrend.push(parseFloat(parseFloat(wVal).toFixed(2)));
        muscleTrend.push(parseFloat(parseFloat(mVal).toFixed(2)));
        fatPercentTrend.push(parseFloat(parseFloat(fVal).toFixed(1)));
        waistTrend.push(parseFloat(parseFloat(waistVal).toFixed(1)));
        chestTrend.push(parseFloat(parseFloat(chestVal).toFixed(1)));
        bicepsTrend.push(parseFloat(parseFloat(bicepsVal).toFixed(1)));
      } else {
        const d1 = new Date(currentActiveDate + 'T00:00:00');
        const d2 = new Date(date + 'T00:00:00');
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const projWeight = Math.max(30, todayWeight + (diffDays * dailyProjWeightChange));
        const projMuscle = Math.max(10, todayMuscle + (diffDays * dailyProjMuscleChange));
        
        const baseFatMass = todayWeight * (todayFatPct / 100);
        const projFatMass = Math.max(1, baseFatMass + (diffDays * dailyProjFatChange));
        const projFatPct = Math.max(1, Math.min(99, (projFatMass / projWeight) * 100));
        
        const projSizes = calculateBodyMeasurements(p.gender || 'male', parseFloat(p.height) || 175, projWeight, projFatPct);
        
        weightTrend.push(parseFloat(projWeight.toFixed(2)));
        muscleTrend.push(parseFloat(projMuscle.toFixed(2)));
        fatPercentTrend.push(parseFloat(projFatPct.toFixed(1)));
        waistTrend.push(parseFloat(parseFloat(projSizes.waist).toFixed(1)));
        chestTrend.push(parseFloat(parseFloat(projSizes.chest).toFixed(1)));
        bicepsTrend.push(parseFloat(parseFloat(projSizes.biceps).toFixed(1)));
      }
    });
    
    return {
      weightTrend,
      muscleTrend,
      fatPercentTrend,
      waistTrend,
      chestTrend,
      bicepsTrend
    };
  }

  // --- Cross-Chart Hover Syncing logic ---
  let isSyncingHover = false;
  
  function syncChartsHover(hoveredIndex, activeChartId) {
    if (isSyncingHover) return;
    isSyncingHover = true;
    
    Object.keys(historyCharts).forEach(key => {
      const chart = historyCharts[key];
      if (!chart || key === activeChartId) return;
      
      chart.setActiveElements([{
        datasetIndex: 0,
        index: hoveredIndex
      }]);
      
      const tooltip = chart.tooltip;
      if (tooltip) {
        const meta = chart.getDatasetMeta(0);
        const dataPoint = meta.data[hoveredIndex];
        if (dataPoint) {
          tooltip.setActiveElements([{
            datasetIndex: 0,
            index: hoveredIndex
          }], {
            x: dataPoint.x,
            y: dataPoint.y
          });
        }
      }
      
      chart.update('none'); // Update immediately without animation
    });
    
    isSyncingHover = false;
  }
  
  function clearChartsHover(activeChartId) {
    if (isSyncingHover) return;
    isSyncingHover = true;
    
    Object.keys(historyCharts).forEach(key => {
      const chart = historyCharts[key];
      if (!chart || key === activeChartId) return;
      
      chart.setActiveElements([]);
      const tooltip = chart.tooltip;
      if (tooltip) {
        tooltip.setActiveElements([], { x: 0, y: 0 });
      }
      chart.update('none');
    });
    
    isSyncingHover = false;
  }

  // --- Render Chart.js Historical Trend Chart ---
  function renderHistoryChart() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded yet. Skipping rendering.');
      return;
    }
    
    const dates = getPastDatesRange(currentActiveDate, activeChartRange);
    const trends = getBodyStateTrendForDates(dates);
    
    const labels = dates.map(d => {
      const parts = d.split('-');
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    });
    
    // Destroy previous charts if they exist
    Object.keys(historyCharts).forEach(key => {
      if (historyCharts[key]) {
        historyCharts[key].destroy();
        historyCharts[key] = null;
      }
    });
    
    // Helper function to generate single independent chart
    function createSingleChart(canvasId, label, data, color, unit, key) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            borderWidth: 2.5,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.2,
            pointRadius: activeChartRange === 7 ? 4 : 2.5,
            pointHoverRadius: 6,
            pointHitRadius: 20,
            tension: 0.3,
            segment: {
              borderDash: ctx => ctx.p1DataIndex > (activeChartRange === 7 ? 3 : 14) ? [5, 5] : undefined
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          onHover: (event, chartElements) => {
            if (chartElements && chartElements.length > 0) {
              const index = chartElements[0].index;
              syncChartsHover(index, key);
            } else {
              clearChartsHover(key);
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 8,
              cornerRadius: 6,
              titleFont: {
                family: 'Plus Jakarta Sans',
                weight: '700',
                size: 11
              },
              bodyFont: {
                family: 'Plus Jakarta Sans',
                size: 11
              },
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `${label}: ${context.parsed.y} ${unit}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.06)'
              },
              ticks: {
                color: '#64748b',
                font: {
                  family: 'Plus Jakarta Sans',
                  size: 9
                }
              }
            },
            y: {
              grace: '8%',
              grid: {
                color: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.06)'
              },
              ticks: {
                color: '#64748b',
                font: {
                  family: 'Plus Jakarta Sans',
                  size: 9
                },
                callback: function(value) {
                  return value + ' ' + unit;
                }
              }
            }
          }
        }
      });
    }
    
    // Instantiate all 6 independent charts
    historyCharts.weight = createSingleChart('chart-weight', '體重', trends.weightTrend, '#8b5cf6', 'kg', 'weight');
    historyCharts.muscle = createSingleChart('chart-muscle', '肌肉量', trends.muscleTrend, '#10b981', 'kg', 'muscle');
    historyCharts.fat = createSingleChart('chart-fat', '體脂率', trends.fatPercentTrend, '#ff6b00', '%', 'fat');
    historyCharts.waist = createSingleChart('chart-waist', '腰圍', trends.waistTrend, '#06b6d4', 'cm', 'waist');
    historyCharts.chest = createSingleChart('chart-chest', '胸圍', trends.chestTrend, '#ec4899', 'cm', 'chest');
    historyCharts.biceps = createSingleChart('chart-biceps', '手臂圍', trends.bicepsTrend, '#f59e0b', 'cm', 'biceps');
  }

  // --- Generate Date List for Chart ---
  function getPastDatesRange(endDateStr, daysCount) {
    const dates = [];
    const endDate = new Date(endDateStr + 'T00:00:00');
    const pastDays = daysCount === 7 ? 3 : 14;
    const futureDays = daysCount === 7 ? 3 : 15;
    
    for (let i = -pastDays; i <= futureDays; i++) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() + i);
      const pad = (n) => String(n).padStart(2, '0');
      dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
    return dates;
  }

  window.changeChartRange = (days) => {
    activeChartRange = days;
    const btn7 = document.getElementById('btn-chart-range-7');
    const btn30 = document.getElementById('btn-chart-range-30');
    if (days === 7) {
      if (btn7) btn7.classList.add('active');
      if (btn30) btn30.classList.remove('active');
    } else {
      if (btn7) btn7.classList.remove('active');
      if (btn30) btn30.classList.add('active');
    }
    renderHistoryChart();
  };

  // --- Update Cumulative Body State UI ---
  function updateCumulativeBodyStateUI() {
    const est = calculateCumulativeBodyState();
    lastEstimatedBodyState = est;
    
    if (el.estWeightVal) el.estWeightVal.textContent = `${est.weight.toFixed(2)} kg`;
    if (el.estMuscleVal) el.estMuscleVal.textContent = `${est.muscle.toFixed(2)} kg`;
    if (el.estFatVal) el.estFatVal.textContent = `${est.fatPercent.toFixed(1)} %`;
    
    // Render current estimated sizes
    const sizes = calculateBodyMeasurements(state.profile.gender, state.profile.height, est.weight, est.fatPercent);
    const offsets = calculateMeasurementOffsets();
    const formatOffsetSpan = (val) => {
      if (val === 0) return '';
      const sign = val >= 0 ? '+' : '';
      return ` <span style="font-size: 10px; font-weight: 500; opacity: 0.8; white-space: nowrap; color: var(--text-secondary);">(${sign}${val.toFixed(1)}cm)</span>`;
    };
    if (el.estWaistVal) el.estWaistVal.innerHTML = `${sizes.waist} cm${formatOffsetSpan(offsets.waist)}`;
    if (el.estChestVal) el.estChestVal.innerHTML = `${sizes.chest} cm${formatOffsetSpan(offsets.chest)}`;
    if (el.estBicepsVal) el.estBicepsVal.innerHTML = `${sizes.biceps} cm${formatOffsetSpan(offsets.biceps)}`;
    
    const log = getActiveLog();
    if (el.inputDailyWeight) {
      el.inputDailyWeight.value = (log.weight !== undefined && log.weight !== null) ? parseFloat(log.weight).toFixed(2) : '';
    }
    if (el.inputDailyMuscle) {
      el.inputDailyMuscle.value = (log.muscle !== undefined && log.muscle !== null) ? parseFloat(log.muscle).toFixed(2) : '';
    }
    if (el.inputDailyFat) {
      el.inputDailyFat.value = (log.fatPercent !== undefined && log.fatPercent !== null) ? parseFloat(log.fatPercent).toFixed(1) : '';
    }
    if (el.inputDailyWaist) {
      el.inputDailyWaist.value = (log.waist !== undefined && log.waist !== null) ? parseFloat(log.waist).toFixed(1) : '';
    }
    if (el.inputDailyChest) {
      el.inputDailyChest.value = (log.chest !== undefined && log.chest !== null) ? parseFloat(log.chest).toFixed(1) : '';
    }
    if (el.inputDailyBiceps) {
      el.inputDailyBiceps.value = (log.biceps !== undefined && log.biceps !== null) ? parseFloat(log.biceps).toFixed(1) : '';
    }
    
    const p = state.profile;
    const initialWeight = parseFloat(p.weight) || 70;
    const initialMuscle = parseFloat(p.muscle) || 30;
    const initialFatPct = parseFloat(p.fatPercent) || 20;
    
    const dWeight = est.weight - initialWeight;
    const dMuscle = est.muscle - initialMuscle;
    const dFat = est.fatPercent - initialFatPct;
    
    let summaryHTML = '';
    if (est.totalLogsCount === 0) {
      summaryHTML = `尚無歷史紀錄可進行體態推估。目前的數值即為初始設定值。`;
      if (el.btnApplyEstBody) el.btnApplyEstBody.style.display = 'none';
    } else {
      const weightSign = dWeight >= 0 ? '+' : '';
      const muscleSign = dMuscle >= 0 ? '+' : '';
      const fatSign = dFat >= 0 ? '+' : '';
      
      summaryHTML = `基於 <strong>${est.totalLogsCount}</strong> 天的歷史紀錄累積計算。<br>
        相較於初始設定：體重 ${weightSign}${dWeight.toFixed(2)} kg，肌肉 ${muscleSign}${dMuscle.toFixed(2)} kg，體脂率 ${fatSign}${dFat.toFixed(1)}%。`;
      
      if (el.btnApplyEstBody) el.btnApplyEstBody.style.display = 'flex';
    }
    
    if (el.estSummaryText) el.estSummaryText.innerHTML = summaryHTML;

    // --- Comparison Analysis & Coach Comments ---
    if (el.dailyComparisonBox) {
      const actWeight = parseFloat(log.weight);
      const actMuscle = parseFloat(log.muscle);
      const actFat = parseFloat(log.fatPercent);
      
      const hasActWeight = !isNaN(actWeight) && actWeight > 0;
      const hasActMuscle = !isNaN(actMuscle) && actMuscle > 0;
      const hasActFat = !isNaN(actFat) && actFat > 0;
      
      const hasAnyActual = hasActWeight || hasActMuscle || hasActFat;
      
      if (hasAnyActual) {
        el.dailyComparisonBox.style.display = 'block';
        if (el.aiCoachDeepBox) el.aiCoachDeepBox.style.display = 'block';
        
        // Reset AI coaching advice text if we switched to a different active date
        if (window.lastAiCoachFeedbackDate !== currentActiveDate) {
          if (el.aiCoachDeepResult) {
            el.aiCoachDeepResult.innerHTML = '點擊上方「即刻點評」按鈕，讓 AI 教練針對您今日的重訓、營養平衡與體態進行精準診斷...';
          }
        }
        
        // Calculate scientific predictions for today (ignoring today's actual inputs)
        const pred = calculateCumulativeBodyState({ ignoreActiveDateActuals: true });
        
        // Determine values & delta strings
        let dWText = '--';
        let dWColor = 'var(--text-muted)';
        if (hasActWeight) {
          const dW = actWeight - pred.weight;
          dWText = `${dW >= 0 ? '+' : ''}${dW.toFixed(2)} kg`;
          if (Math.abs(dW) <= 0.2) {
            dWColor = 'var(--text-secondary)';
          } else if (dW < -0.2) {
            dWColor = 'var(--accent-green)';
          } else {
            dWColor = '#ef4444';
          }
        }
        
        let dMText = '--';
        let dMColor = 'var(--text-muted)';
        if (hasActMuscle) {
          const dM = actMuscle - pred.muscle;
          dMText = `${dM >= 0 ? '+' : ''}${dM.toFixed(2)} kg`;
          if (Math.abs(dM) <= 0.1) {
            dMColor = 'var(--text-secondary)';
          } else if (dM < -0.1) {
            dMColor = 'var(--accent-green)';
          } else {
            dMColor = '#ef4444';
          }
        }
        
        let dFText = '--';
        let dFColor = 'var(--text-muted)';
        if (hasActFat) {
          const dF = actFat - pred.fatPercent;
          dFText = `${dF >= 0 ? '+' : ''}${dF.toFixed(1)} %`;
          if (Math.abs(dF) <= 0.2) {
            dFColor = 'var(--text-secondary)';
          } else if (dF < -0.2) {
            dFColor = 'var(--accent-green)';
          } else {
            dFColor = '#ef4444';
          }
        }
        
        // Generate Coach Comments
        let comments = [];

        // Check for Weight Plateau
        const isPlateau = detectWeightPlateau();
        if (isPlateau) {
          el.dailyComparisonBox.classList.add('plateau-warning');
          comments.push(`⚠️ <strong>代謝平台期警示</strong>：偵測到您的體重在近 14 天內幾乎沒有變動（標準差極小），且您一直維持在卡路里赤字中。這代表新陳代謝發生了代償性適應。建議您適度安排 3-5 天的<b>「飲食回饋期 (Diet Break)」</b>，將卡路里暫時吃回 TDEE 正常值，以活化代謝率與瘦素（Leptin）分泌後，再重新啟動赤字。`);
        } else {
          el.dailyComparisonBox.classList.remove('plateau-warning');
        }

        if (hasActWeight) {
          const dW = actWeight - pred.weight;
          if (dW < -0.5) {
            comments.push(`💡 <strong>體重分析</strong>：實測體重顯著低於科學預估值（-${Math.abs(dW).toFixed(2)} kg）。這通常代表體內水分大幅排出（如低碳飲食、排汗較多），或近期熱量赤字超乎預期。請記得適時補充水分與電解質！`);
          } else if (dW > 0.5) {
            comments.push(`💡 <strong>體重分析</strong>：實測體重高於科學預估值（+${dW.toFixed(2)} kg）。別擔心，這通常是由於高碳水飲食導致的糖原儲水、或是鈉攝取過多引起的水份滯留，並非真的長了脂肪。持續保持熱量赤字即可！`);
          } else {
            comments.push(`💡 <strong>體重分析</strong>：體重與預估值極為接近（${dW >= 0 ? '+' : ''}${dW.toFixed(2)} kg）。您的能量平衡與飲食消耗計算極度精準，身體正穩定照著計劃前進。`);
          }
        }
        
        if (hasActMuscle) {
          const dM = actMuscle - pred.muscle;
          if (dM < -0.3) {
            comments.push(`💪 <strong>肌肉分析</strong>：實測肌肉量低於預期（-${Math.abs(dM).toFixed(2)} kg）。這可能是由於脫水造成的肌肉飽滿度下降，或是近期蛋白質攝取不夠。建議每日補充足夠的蛋白質（目標: ${p.targetProtein}g），並維持適當的重訓刺激。`);
          } else if (dM > 0.3) {
            comments.push(`💪 <strong>肌肉分析</strong>：肌肉量高於預估值（+${dM.toFixed(2)} kg）。非常棒的表現！這代表阻力訓練帶來的充血或增肌效果顯著。請持續維持高品質的蛋白質攝取與力量訓練強度！`);
          } else {
            comments.push(`💪 <strong>肌肉分析</strong>：肌肉量穩定維持在預期範圍內。這顯示您目前的訓練與營養補給足以維持肌肉量，避免了肌肉流失。`);
          }
        }
        
        if (hasActFat) {
          const dF = actFat - pred.fatPercent;
          if (dF < -0.5) {
            comments.push(`🔥 <strong>體脂分析</strong>：體脂率優於預估值（-${Math.abs(dF).toFixed(1)}%）。這是極佳的減脂訊號，代表純脂肪消耗成效亮眼！請繼續保持乾淨的飲食習慣，避免精緻糖類。`);
          } else if (dF > 0.5) {
            comments.push(`🔥 <strong>體脂分析</strong>：實測體脂率高於預估值（+${dF.toFixed(1)}%）。體脂率測量（特別是家用體脂計）極易受到身體導電度與水分波動影響。建議固定測量時間（如晨起空腹），並拉長一到兩週觀察趨勢，不需因單日波動氣餒。`);
          } else {
            comments.push(`🔥 <strong>體脂分析</strong>：體脂表現符合預期。您的脂肪控制正處於良性進程中，繼續保持目前的宏量營養素比例即可！`);
          }
        }
        
        const commentListHTML = comments.map(c => `
          <div style="background: rgba(255, 255, 255, 0.02); padding: 6px 8px; border-radius: 6px; border-left: 3px solid var(--accent-purple); text-align: left; line-height: 1.5; margin-bottom: 4px;">${c}</div>
        `).join('');
        
        el.dailyComparisonBox.innerHTML = `
          <div style="font-weight: 700; font-size: 11px; color: var(--accent-purple-light); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            今日實測 vs 科學預測（教練分析）
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <div style="text-align: center;">
              <div style="font-size: 9px; color: var(--text-muted);">體重比較</div>
              <div style="font-size: 11px; font-weight: 700; color: white;">
                ${hasActWeight ? actWeight.toFixed(1) + ' kg' : '--'}
              </div>
              <div style="font-size: 9px; color: var(--text-muted); scale: 0.9; margin: 1px 0;">預估 ${pred.weight.toFixed(1)}</div>
              <div style="font-size: 10px; font-weight: 600; color: ${dWColor};">
                ${dWText}
              </div>
            </div>
            <div style="text-align: center; border-left: 1px solid rgba(255, 255, 255, 0.08); border-right: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-size: 9px; color: var(--text-muted);">肌肉比較</div>
              <div style="font-size: 11px; font-weight: 700; color: white;">
                ${hasActMuscle ? actMuscle.toFixed(1) + ' kg' : '--'}
              </div>
              <div style="font-size: 9px; color: var(--text-muted); scale: 0.9; margin: 1px 0;">預估 ${pred.muscle.toFixed(1)}</div>
              <div style="font-size: 10px; font-weight: 600; color: ${dMColor};">
                ${dMText}
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 9px; color: var(--text-muted);">體脂比較</div>
              <div style="font-size: 11px; font-weight: 700; color: white;">
                ${hasActFat ? actFat.toFixed(1) + '%' : '--'}
              </div>
              <div style="font-size: 9px; color: var(--text-muted); scale: 0.9; margin: 1px 0;">預估 ${pred.fatPercent.toFixed(1)}%</div>
              <div style="font-size: 10px; font-weight: 600; color: ${dFColor};">
                ${dFText}
              </div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${commentListHTML}
          </div>
        `;
      } else {
        el.dailyComparisonBox.style.display = 'none';
        if (el.aiCoachDeepBox) el.aiCoachDeepBox.style.display = 'none';
      }
    }
    
    // Draw/update body shape avatar scanner with the latest parameters
    if (el.bodyShapeSprite) {
      const p = state.profile;
      drawBodyShapeAvatar(p.gender, est.weight, p.height, est.muscle, est.fatPercent);
      
      // Calculate ratios and update the 1-9 body shape matrix highlights
      const heightM = p.height / 100;
      const stdMuscleBase = heightM * heightM * 22 * 0.4;
      const currentMuscleRatio = est.muscle / (stdMuscleBase || 28);
      
      renderBodyShapeMatrix(p.gender, p.height, currentMuscleRatio, est.fatPercent);
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
    
    // Dynamic TDEE Calibration UI feedback
    const tdeeOffset = calculateAdaptiveTdeeOffset();
    if (tdeeOffset !== 0) {
      if (el.tdeeCalibratedBadge) el.tdeeCalibratedBadge.style.display = 'inline-block';
      if (el.adaptiveTdeeInfo) el.adaptiveTdeeInfo.style.display = 'block';
      if (el.adaptiveTdeeOffsetVal) el.adaptiveTdeeOffsetVal.textContent = (tdeeOffset >= 0 ? '+' : '') + tdeeOffset;
    } else {
      if (el.tdeeCalibratedBadge) el.tdeeCalibratedBadge.style.display = 'none';
      if (el.adaptiveTdeeInfo) el.adaptiveTdeeInfo.style.display = 'none';
    }
    
    // 3. Calorie Ring Totals
    const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const totalOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
    const totalWorkoutMins = log.workouts.reduce((sum, w) => sum + (parseFloat(w.duration) || 0), 0);
    const doubleCounted = Math.round((tdee / 1440) * totalWorkoutMins);
    const netCalories = totalIn - (tdee + totalOut - doubleCounted);
    
    el.totalCalIn.textContent = `${Math.round(totalIn)} kcal`;
    el.totalCalOut.textContent = `${Math.round(tdee + totalOut - doubleCounted)} kcal`;
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
    const progressInPercent = Math.min(2.0, totalIn / targetIn);
    
    let offsetIn;
    let offsetInOverflow;
    if (progressInPercent <= 1.0) {
      offsetIn = 314 - (314 * progressInPercent);
      offsetInOverflow = 314; // Hidden (fully offset)
      if (el.ringProgressInOverflow) {
        el.ringProgressInOverflow.style.display = 'none';
      }
      if (progressInPercent === 0) {
        el.ringProgressIn.style.display = 'none';
      } else {
        el.ringProgressIn.style.display = 'block';
      }
    } else {
      offsetIn = 0; // 100% full
      offsetInOverflow = 314 - (314 * (progressInPercent - 1.0));
      el.ringProgressIn.style.display = 'block';
      if (el.ringProgressInOverflow) {
        el.ringProgressInOverflow.style.display = 'block';
      }
    }
    el.ringProgressIn.style.strokeDashoffset = offsetIn;
    if (el.ringProgressInOverflow) {
      el.ringProgressInOverflow.style.strokeDashoffset = offsetInOverflow;
    }
    
    // Workout Burn Progress (Inner ring, r=42, circumference = 264)
    // We assume standard active burn target of 400 kcal
    const targetActiveOut = 400;
    const progressOutPercent = Math.min(2.0, totalOut / targetActiveOut);
    
    let offsetOut;
    let offsetOutOverflow;
    if (progressOutPercent <= 1.0) {
      offsetOut = 264 - (264 * progressOutPercent);
      offsetOutOverflow = 264; // Hidden (fully offset)
      if (el.ringProgressOutOverflow) {
        el.ringProgressOutOverflow.style.display = 'none';
      }
      if (progressOutPercent === 0) {
        el.ringProgressOut.style.display = 'none';
      } else {
        el.ringProgressOut.style.display = 'block';
      }
    } else {
      offsetOut = 0; // 100% full
      offsetOutOverflow = 264 - (264 * (progressOutPercent - 1.0));
      el.ringProgressOut.style.display = 'block';
      if (el.ringProgressOutOverflow) {
        el.ringProgressOutOverflow.style.display = 'block';
      }
    }
    el.ringProgressOut.style.strokeDashoffset = offsetOut;
    if (el.ringProgressOutOverflow) {
      el.ringProgressOutOverflow.style.strokeDashoffset = offsetOutOverflow;
    }
    
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
    if (el.summaryHeight) el.summaryHeight.textContent = `${p.height} cm`;
    el.summaryWeight.textContent = `${parseFloat(p.weight).toFixed(2)} kg`;
    el.summaryMuscle.textContent = `${parseFloat(p.muscle).toFixed(2)} kg`;
    el.summaryFatPercent.textContent = `${parseFloat(p.fatPercent).toFixed(1)} %`;
    el.summaryActivity.textContent = getActivityDisplayName(p.activity);
    el.summaryRestDays.textContent = `${p.restDays !== undefined ? p.restDays : 2} 天`;
    
    // 8. Run calculations to update forecasts
    updateProjections();

    // 9. Update Favorite lists
    updateFavoriteWorkoutsUI();
    updateFavoriteDietUI();

    // 10. Update Estimated Body State Card & Historical Trend Chart
    updateCumulativeBodyStateUI();
    renderHistoryChart();
    
    // 11. Update Cross-Correlation Insights
    updateCrossCorrelationsUI();

    // 12. Update Calorie Bank
    updateCalorieBankUI();
  }

  function updateCrossCorrelationsUI() {
    const stats = calculateCrossCorrelations();
    
    // 1. Render Protein Insight
    if (el.insightProteinData) {
      if (stats.proteinHighDays === 0 && stats.proteinLowDays === 0) {
        el.insightProteinData.innerHTML = `⚠️ 尚無足夠飲食記錄可進行關聯性分析。`;
        if (el.insightProteinHighVal) el.insightProteinHighVal.textContent = '--';
        if (el.insightProteinLowVal) el.insightProteinLowVal.textContent = '--';
        if (el.insightProteinHighBar) el.insightProteinHighBar.style.width = '0%';
        if (el.insightProteinLowBar) el.insightProteinLowBar.style.width = '0%';
      } else {
        const signHigh = stats.avgMuscleChangeProteinHigh >= 0 ? '+' : '';
        const signLow = stats.avgMuscleChangeProteinLow >= 0 ? '+' : '';
        
        if (el.insightProteinHighVal) el.insightProteinHighVal.textContent = `${signHigh}${stats.avgMuscleChangeProteinHigh.toFixed(3)} kg`;
        if (el.insightProteinLowVal) el.insightProteinLowVal.textContent = `${signLow}${stats.avgMuscleChangeProteinLow.toFixed(3)} kg`;
        
        const maxVal = 0.05;
        const widthHigh = Math.min(100, Math.max(5, (Math.abs(stats.avgMuscleChangeProteinHigh) / maxVal) * 100));
        const widthLow = Math.min(100, Math.max(5, (Math.abs(stats.avgMuscleChangeProteinLow) / maxVal) * 100));
        
        if (el.insightProteinHighBar) el.insightProteinHighBar.style.width = `${widthHigh}%`;
        if (el.insightProteinLowBar) el.insightProteinLowBar.style.width = `${widthLow}%`;
        
        let proteinMsg = '';
        if (stats.avgMuscleChangeProteinHigh > stats.avgMuscleChangeProteinLow) {
          const diff = stats.avgMuscleChangeProteinHigh - stats.avgMuscleChangeProteinLow;
          proteinMsg = `💡 基於 <b>${stats.proteinHighDays}</b> 天達標與 <b>${stats.proteinLowDays}</b> 天未達標紀錄，分析指出：當您的<b>蛋白質攝取達標時</b>，平均每日肌肉量變化比未達標時<b>多出 ${diff.toFixed(3)} kg</b>。這證明充足的蛋白質對於肌肉合成/保留有顯著成效！`;
        } else if (stats.proteinHighDays > 0 && stats.proteinLowDays > 0) {
          proteinMsg = `💡 基於 <b>${stats.proteinHighDays}</b> 天達標與 <b>${stats.proteinLowDays}</b> 天未達標紀錄，分析指出：蛋白質達標與否對您的肌肉量沒有明顯的淨差。建議確保重訓強度，以更好地刺激肌肉合成。`;
        } else {
          proteinMsg = `💡 數據累積中。目前記錄了 ${stats.proteinHighDays} 天達標與 ${stats.proteinLowDays} 天未達標。`;
        }
        el.insightProteinData.innerHTML = proteinMsg;
      }
    }

    // 2. Render Workout Insight
    if (el.insightWorkoutData) {
      if (stats.workoutYesDays === 0 && stats.workoutNoDays === 0) {
        el.insightWorkoutData.innerHTML = `⚠️ 尚無足夠運動記錄可進行關聯性分析。`;
        if (el.insightWorkoutYesVal) el.insightWorkoutYesVal.textContent = '--';
        if (el.insightWorkoutNoVal) el.insightWorkoutNoVal.textContent = '--';
        if (el.insightWorkoutYesBar) el.insightWorkoutYesBar.style.width = '0%';
        if (el.insightWorkoutNoBar) el.insightWorkoutNoBar.style.width = '0%';
      } else {
        if (el.insightWorkoutYesVal) el.insightWorkoutYesVal.textContent = `${stats.avgFatPctChangeWorkoutYes.toFixed(2)}%`;
        if (el.insightWorkoutNoVal) el.insightWorkoutNoVal.textContent = `${stats.avgFatPctChangeWorkoutNo.toFixed(2)}%`;
        
        const maxVal = 0.5;
        const widthYes = Math.min(100, Math.max(5, (Math.abs(stats.avgFatPctChangeWorkoutYes) / maxVal) * 100));
        const widthNo = Math.min(100, Math.max(5, (Math.abs(stats.avgFatPctChangeWorkoutNo) / maxVal) * 100));
        
        if (el.insightWorkoutYesBar) el.insightWorkoutYesBar.style.width = `${widthYes}%`;
        if (el.insightWorkoutNoBar) el.insightWorkoutNoBar.style.width = `${widthNo}%`;
        
        let workoutMsg = '';
        if (stats.avgFatPctChangeWorkoutYes < stats.avgFatPctChangeWorkoutNo) {
          const diff = Math.abs(stats.avgFatPctChangeWorkoutYes - stats.avgFatPctChangeWorkoutNo);
          workoutMsg = `💡 基於 <b>${stats.workoutYesDays}</b> 天阻力訓練與 <b>${stats.workoutNoDays}</b> 天非阻力訓練紀錄，分析指出：當您進行了 <b>30 分鐘以上阻力訓練時</b>，體脂率平均每日下降速率比沒有重訓時<b>快了 ${diff.toFixed(2)}%</b>。阻力訓練顯著提升了您的脂肪燃燒率！`;
        } else if (stats.workoutYesDays > 0 && stats.workoutNoDays > 0) {
          workoutMsg = `💡 基於 <b>${stats.workoutYesDays}</b> 天阻力訓練與 <b>${stats.workoutNoDays}</b> 天非阻力訓練紀錄，分析指出：阻力訓練日與非訓練日的體脂率變化接近。建議配合卡路里赤字，以發揮最大的阻力訓練減脂優勢。`;
        } else {
          workoutMsg = `💡 數據累積中。目前記錄了 ${stats.workoutYesDays} 天阻力訓練與 ${stats.workoutNoDays} 天非阻力訓練。`;
        }
        el.insightWorkoutData.innerHTML = workoutMsg;
      }
    }
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
  if (el.btnCopyDietPrompt) {
    el.btnCopyDietPrompt.addEventListener('click', () => {
      const text = el.aiPromptInput.value.trim();
      if (!text) {
        showToast('請先輸入您吃了些什麼！', 'warning');
        return;
      }
      
      const systemInstruction = `你是一位專業的繁體中文營養師與飲食分析助手。
請分析使用者輸入的飲食內容（繁體中文），識別裡面包含的每一項食物，並估算其熱量（大卡）、蛋白質（克）、碳水化合物（克）與脂肪（克）。
你必須只回傳一個 Raw JSON Array，裡面是包含每項食物的 Object。
請勿包含任何 Markdown 標記，例如 \`\`\`json 等，直接回傳純 JSON 文字。

JSON Array Object 結構格式如下，且欄位名稱必須完全一致：
[
  {"name": "雞胸肉", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
  {"name": "糙米飯", "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9}
]

注意：若無法辨識食物，請使用合理猜測的估算，確保熱量與營養數值合理完整。

分析飲食描述：${text}`;

      navigator.clipboard.writeText(systemInstruction)
        .then(() => {
          showToast('飲食分析 Prompt 已複製到剪貼簿！可直接貼給 Gemini 詢問。', 'success');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          const textarea = document.createElement('textarea');
          textarea.value = systemInstruction;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            showToast('飲食分析 Prompt 已複製！', 'success');
          } catch (copyErr) {
            showToast('複製失敗，請手動複製。', 'error');
          }
          document.body.removeChild(textarea);
        });
    });
  }

  el.btnAiEstimate.addEventListener('click', async () => {
    const promptText = el.aiPromptInput.value.trim();
    if (!promptText) {
      showToast('請先輸入您吃了些什麼！', 'info');
      return;
    }
    
    // Check if user pasted a raw JSON response directly from Gemini
    if (promptText.startsWith('[') && promptText.endsWith(']')) {
      try {
        const parsed = JSON.parse(promptText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          showToast('成功偵測並解析手動貼入的 Gemini JSON 數據！', 'success');
          displayAiResults(parsed);
          return;
        }
      } catch (e) {
        // Fall back to API if parsing fails
      }
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
      // Call Gemini parser via the Google Apps Script Web App proxy using POST
      const resData = await postRequest(sheetsUrl, {
        action: 'estimateFood',
        text: promptText
      });
      
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
  if (el.btnCopyWorkoutPrompt) {
    el.btnCopyWorkoutPrompt.addEventListener('click', () => {
      const text = el.aiWorkoutPromptInput.value.trim();
      if (!text) {
        showToast('請先輸入您做了什麼運動！', 'warning');
        return;
      }
      
      const p = state.profile;
      const weight = parseFloat(p.weight) || 70;

      const systemInstruction = `你是一位專業的中文運動與健身教練。
請分析使用者輸入的運動內容（繁體中文），估算每項運動的時間、強度與消耗的熱量。
使用者的體重是 ${weight} kg，計算消耗熱量公式請參考 MET 標準：消耗熱量 = MET * 體重(kg) * (時間(分鐘) / 60)。
常見運動 MET 參考值：慢跑/跑步(中強度9.8/高強度11.5)，重量訓練(中強度5.0/高強度6.0)，散步/走路(3.5)，單車/自行車(中強度6.0)，游泳(8.0)，HIIT(8.5)，瑜珈(3.0)。
對於其他自訂項目（如打籃球、打羽球、爬山等），請使用合理的運動生理學 MET 值計算。
你必須只回傳一個 Raw JSON Array，裡面是包含每項運動的 Object。
請勿包含任何 Markdown 標記，例如 \`\`\`json 等，直接回傳純 JSON 文字。

JSON Array Object 結構格式如下，其中 intensity 欄位只能是 'low'、'medium' 或 'high' 其中之一，type 欄位可為 running, weight, walking, cycling, swimming, hiit, yoga 或 custom：
[
  {"name": "打籃球", "duration": 60, "intensity": "medium", "calories": 380, "type": "custom"},
  {"name": "慢跑", "duration": 30, "intensity": "high", "calories": 400, "type": "running"}
]

注意：若無法辨識運動，請使用合理猜測的估算，確保熱量與時間數值合理完整。

分析運動描述：${text}`;

      navigator.clipboard.writeText(systemInstruction)
        .then(() => {
          showToast('運動分析 Prompt 已複製到剪貼簿！可直接貼給 Gemini 詢問。', 'success');
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          const textarea = document.createElement('textarea');
          textarea.value = systemInstruction;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            showToast('運動分析 Prompt 已複製！', 'success');
          } catch (copyErr) {
            showToast('複製失敗，請手動複製。', 'error');
          }
          document.body.removeChild(textarea);
        });
    });
  }

  el.btnAiWorkoutEstimate.addEventListener('click', async () => {
    const promptText = el.aiWorkoutPromptInput.value.trim();
    if (!promptText) {
      showToast('請先輸入您做了什麼運動！', 'info');
      return;
    }
    
    // Check if user pasted a raw JSON response directly from Gemini
    if (promptText.startsWith('[') && promptText.endsWith(']')) {
      try {
        const parsed = JSON.parse(promptText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          showToast('成功偵測並解析手動貼入的 Gemini JSON 數據！', 'success');
          displayAiWorkoutResults(parsed);
          return;
        }
      } catch (e) {
        // Fall back to API if parsing fails
      }
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
      // Call Gemini parser via the Google Apps Script Web App proxy using POST
      const resData = await postRequest(sheetsUrl, {
        action: 'estimateWorkout',
        text: promptText,
        weight: parseFloat(state.profile.weight) || 70
      });
      
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
    let duration = 0;
    const hourMatch = promptText.match(/(\d+(?:\.\d+)?)\s*(?:小時|hr|hour)/);
    const minMatch = promptText.match(/(\d+)\s*(?:分鐘|分|min)/);
    
    if (hourMatch) {
      duration += Math.round(parseFloat(hourMatch[1]) * 60);
    }
    if (minMatch) {
      duration += parseInt(minMatch[1]);
    }
    if (duration === 0) {
      duration = 30; // Default
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
    if (!el.motivateQuoteText || !el.motivateQuoteAuthor) return;
    // Pick daily quote randomly
    const quoteIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
    const quote = MOTIVATION_QUOTES[quoteIndex];
    el.motivateQuoteText.textContent = quote.text;
    el.motivateQuoteAuthor.textContent = `— ${quote.author}`;
  }

  if (el.btnGetSpark) {
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
      
      if (el.motivateQuoteText) el.motivateQuoteText.textContent = dynamicWords;
      if (el.motivateQuoteAuthor) el.motivateQuoteAuthor.textContent = "— FitSpark 智慧語音督導員";
      
      // Trigger effects
      triggerConfetti();
      showToast('獲得一次動力補給！', 'success');
    });
  }

  if (el.btnSpeakQuote) {
    el.btnSpeakQuote.addEventListener('click', () => {
      if (!el.motivateQuoteText) return;
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
  }

  // Ensure voices are loaded for SpeechSynthesis
  if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Just hooks to ensure voices loaded properly
    };
  }

  // --- Google Sheets Synchronization Modal Trigger ---
  el.syncSheetsBtn.addEventListener('click', () => {
    const sheetsUrl = state.profile.sheetsUrl;
    if (!sheetsUrl) {
      showToast('請先點擊右上角設定按鈕，設定您的 Google Sheets 同步網址。', 'info');
      el.settingsModal.classList.add('active');
      return;
    }
    el.syncModal.classList.add('active');
  });

  el.btnCloseSync.addEventListener('click', () => {
    el.syncModal.classList.remove('active');
  });

  el.syncModal.addEventListener('click', (e) => {
    if (e.target === el.syncModal) {
      el.syncModal.classList.remove('active');
    }
  });

  // --- Sync Action: Download from Cloud (Overwrites Local) ---
  el.btnSyncDownload.addEventListener('click', async () => {
    const sheetsUrl = state.profile.sheetsUrl;
    if (!sheetsUrl) return;

    el.btnSyncDownload.disabled = true;
    const originalText = el.btnSyncDownload.textContent;
    el.btnSyncDownload.textContent = '讀取下載中...';

    try {
      showToast('正在從雲端載入數據...', 'info');
      const pullRes = await postRequest(sheetsUrl, { action: 'pullData' });
      
      if (pullRes.result === 'success') {
        // Overwrite Profile settings (except local-only values like sheetsUrl and geminiApiKey)
        if (pullRes.profile && Object.keys(pullRes.profile).length > 0) {
          const originalSheetsUrl = state.profile.sheetsUrl;
          const originalApiKey = state.profile.geminiApiKey;
          state.profile = { ...state.profile, ...pullRes.profile };
          state.profile.sheetsUrl = originalSheetsUrl; // Preserve local URL
          state.profile.geminiApiKey = originalApiKey; // Preserve API Key
        }
        
        // Overwrite Daily logs entirely with cloud version
        if (pullRes.logs) {
          state.dailyLogs = {}; // Clear local logs before loading
          pullRes.logs.forEach(row => {
            const date = row.date;
            if (!date) return;
            
            let dateStr = date;
            if (date.includes('T')) {
              dateStr = date.split('T')[0];
            }
            
            let workouts = [];
            let diet = [];
            
            try {
              workouts = JSON.parse(row.workoutsJson || '[]');
            } catch(e) {
              console.error('Failed to parse workoutsJson:', e);
            }
            
            try {
              diet = JSON.parse(row.dietJson || '[]');
            } catch(e) {
              console.error('Failed to parse dietJson:', e);
            }
            
            const logEntry = { workouts, diet };
            
            // Parse weight, muscle, bodyFat columns from sheet daily log rows
            const wVal = parseFloat(row.weight);
            const mVal = parseFloat(row.muscle);
            const fVal = parseFloat(row.bodyFat); // column name in Apps Script is bodyFat
            const waistVal = parseFloat(row.waist);
            const chestVal = parseFloat(row.chest);
            const bicepsVal = parseFloat(row.biceps);
            
            if (!isNaN(wVal) && wVal > 0) logEntry.weight = parseFloat(wVal.toFixed(2));
            if (!isNaN(mVal) && mVal > 0) logEntry.muscle = parseFloat(mVal.toFixed(2));
            if (!isNaN(fVal) && fVal > 0) logEntry.fatPercent = parseFloat(fVal.toFixed(1));
            if (!isNaN(waistVal) && waistVal > 0) logEntry.waist = parseFloat(waistVal.toFixed(1));
            if (!isNaN(chestVal) && chestVal > 0) logEntry.chest = parseFloat(chestVal.toFixed(1));
            if (!isNaN(bicepsVal) && bicepsVal > 0) logEntry.biceps = parseFloat(bicepsVal.toFixed(1));
            
            state.dailyLogs[dateStr] = logEntry;
          });
        }
        
        saveStateToStorage();
        updateUI();
        el.syncModal.classList.remove('active');
        showToast('雲端數據下載成功！已覆蓋此裝置資料。', 'success');
        triggerConfetti();
      } else {
        throw new Error(pullRes.message || '雲端回傳失敗');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('下載失敗，請檢查 Apps Script 設定或雲端權限。', 'error');
    } finally {
      el.btnSyncDownload.disabled = false;
      el.btnSyncDownload.textContent = originalText;
    }
  });

  // --- Sync Action: Upload to Cloud (Overwrites Cloud) ---
  el.btnSyncUpload.addEventListener('click', async () => {
    const sheetsUrl = state.profile.sheetsUrl;
    if (!sheetsUrl) return;

    el.btnSyncUpload.disabled = true;
    const originalText = el.btnSyncUpload.textContent;
    el.btnSyncUpload.textContent = '上傳同步中...';

    try {
      showToast('正在將此裝置資料上傳至雲端...', 'info');
      
      const syncPayload = {
        logs: state.dailyLogs,
        profile: state.profile
      };
      
      const pushRes = await postRequest(sheetsUrl, {
        action: 'pushData',
        data: syncPayload
      });
      
      if (pushRes.result === 'success') {
        el.syncModal.classList.remove('active');
        showToast('本機資料已成功上傳覆蓋雲端！', 'success');
        triggerConfetti();
      } else {
        throw new Error(pushRes.message || '雲端寫入失敗');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('上傳失敗，請檢查 Apps Script 設定或雲端權限。', 'error');
    } finally {
      el.btnSyncUpload.disabled = false;
      el.btnSyncUpload.textContent = originalText;
    }
  });

  // --- Settings Form Dialog ---
  el.settingsBtn.addEventListener('click', () => {
    // Fill settings inputs with current profile state
    const p = state.profile;
    el.inputGender.value = p.gender;
    el.inputAge.value = p.age;
    el.inputHeight.value = p.height;
    el.inputWeight.value = parseFloat(p.weight).toFixed(2);
    el.inputMuscle.value = parseFloat(p.muscle).toFixed(2);
    el.inputFatPercent.value = parseFloat(p.fatPercent).toFixed(1);
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
      
      // If switching to trends tab, force-render charts to compute container dimensions correctly
      if (tabName === 'trends') {
        renderHistoryChart();
      }
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
    
    // Set initial date picker value
    el.activeDatePicker.value = currentActiveDate;
    
    // Date picker change event
    el.activeDatePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        currentActiveDate = e.target.value;
        updateUI();
      }
    });

    // Prev Day event
    el.btnPrevDay.addEventListener('click', () => {
      const dateObj = new Date(currentActiveDate + 'T00:00:00');
      dateObj.setDate(dateObj.getDate() - 1);
      const pad = (n) => String(n).padStart(2, '0');
      currentActiveDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
      el.activeDatePicker.value = currentActiveDate;
      updateUI();
    });

    // Next Day event
    el.btnNextDay.addEventListener('click', () => {
      const dateObj = new Date(currentActiveDate + 'T00:00:00');
      dateObj.setDate(dateObj.getDate() + 1);
      const pad = (n) => String(n).padStart(2, '0');
      currentActiveDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
      el.activeDatePicker.value = currentActiveDate;
      updateUI();
    });

    // Apply Estimated Body State event
    if (el.btnApplyEstBody) {
      el.btnApplyEstBody.addEventListener('click', () => {
        if (!lastEstimatedBodyState) return;
        
        state.profile.weight = parseFloat(lastEstimatedBodyState.weight.toFixed(2));
        state.profile.muscle = parseFloat(lastEstimatedBodyState.muscle.toFixed(2));
        state.profile.fatPercent = parseFloat(lastEstimatedBodyState.fatPercent.toFixed(1));
        
        if (el.inputWeight) el.inputWeight.value = state.profile.weight;
        if (el.inputMuscle) el.inputMuscle.value = state.profile.muscle;
        if (el.inputFatPercent) el.inputFatPercent.value = state.profile.fatPercent;
        
        saveStateToStorage();
        updateUI();
        
        showToast('已成功套用估算體態至您的基本設定！TDEE 與預測已自動更新。', 'success');
        triggerConfetti();
      });
    }

    // Save Daily Weight, Muscle, and Fat event
    if (el.btnSaveDailyWeight) {
      el.btnSaveDailyWeight.addEventListener('click', () => {
        const weightVal = parseFloat(el.inputDailyWeight.value);
        const muscleVal = parseFloat(el.inputDailyMuscle.value);
        const fatVal = parseFloat(el.inputDailyFat.value);
        const waistVal = parseFloat(el.inputDailyWaist.value);
        const chestVal = parseFloat(el.inputDailyChest.value);
        const bicepsVal = parseFloat(el.inputDailyBiceps.value);
        const log = getActiveLog();
        
        let savedMsgs = [];
        let clearedMsgs = [];
        const isToday = (currentActiveDate === getTodayDateString());
        
        if (!isNaN(weightVal) && weightVal > 0) {
          log.weight = weightVal;
          savedMsgs.push(`體重 ${weightVal} kg`);
          if (isToday) {
            state.profile.weight = weightVal;
            if (el.inputWeight) el.inputWeight.value = weightVal;
          }
        } else {
          delete log.weight;
          clearedMsgs.push('體重');
        }
        
        if (!isNaN(muscleVal) && muscleVal > 0) {
          log.muscle = muscleVal;
          savedMsgs.push(`肌肉 ${muscleVal} kg`);
          if (isToday) {
            state.profile.muscle = muscleVal;
            if (el.inputMuscle) el.inputMuscle.value = muscleVal;
          }
        } else {
          delete log.muscle;
          clearedMsgs.push('肌肉');
        }
        
        if (!isNaN(fatVal) && fatVal > 0) {
          log.fatPercent = fatVal;
          savedMsgs.push(`體脂 ${fatVal}%`);
          if (isToday) {
            state.profile.fatPercent = fatVal;
            if (el.inputFatPercent) el.inputFatPercent.value = fatVal;
          }
        } else {
          delete log.fatPercent;
          clearedMsgs.push('體脂');
        }

        if (!isNaN(waistVal) && waistVal > 0) {
          log.waist = waistVal;
          savedMsgs.push(`腰圍 ${waistVal} cm`);
        } else {
          delete log.waist;
          clearedMsgs.push('腰圍');
        }

        if (!isNaN(chestVal) && chestVal > 0) {
          log.chest = chestVal;
          savedMsgs.push(`胸圍 ${chestVal} cm`);
        } else {
          delete log.chest;
          clearedMsgs.push('胸圍');
        }

        if (!isNaN(bicepsVal) && bicepsVal > 0) {
          log.biceps = bicepsVal;
          savedMsgs.push(`手臂圍 ${bicepsVal} cm`);
        } else {
          delete log.biceps;
          clearedMsgs.push('手臂圍');
        }
        
        saveStateToStorage();
        updateUI();
        
        if (savedMsgs.length > 0) {
          const syncSuffix = isToday ? '（已同步更新至您的基本設定）' : '';
          showToast(`已儲存 ${currentActiveDate} 的數據：${savedMsgs.join('、')}${syncSuffix}`, 'success');
        } else {
          showToast(`已清除 ${currentActiveDate} 的實測紀錄：${clearedMsgs.join('、')}`, 'info');
        }
      });
    }

    function getCoachPrompt() {
      const log = getActiveLog();
      const p = state.profile;
      const tdee = calculateTdee();
      
      const totalIn = log.diet.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
      const totalProtein = log.diet.reduce((sum, item) => sum + (parseFloat(item.protein) || 0), 0);
      const totalCarbs = log.diet.reduce((sum, item) => sum + (parseFloat(item.carbs) || 0), 0);
      const totalFat = log.diet.reduce((sum, item) => sum + (parseFloat(item.fat) || 0), 0);
      const totalOut = log.workouts.reduce((sum, item) => sum + (parseFloat(item.calories) || 0), 0);
      const netCalories = totalIn - (tdee + totalOut);

      const pred = calculateCumulativeBodyState({ ignoreActiveDateActuals: true });
      
      const contextPayload = `
日期：${currentActiveDate}
【實際攝取與消耗】
- 總攝取熱量：${Math.round(totalIn)} kcal (目標: ${p.targetCalories} kcal)
- 蛋白質：${totalProtein.toFixed(1)}g (目標: ${p.targetProtein}g)
- 碳水化合物：${totalCarbs.toFixed(1)}g (目標: ${p.targetCarbs}g)
- 脂肪：${totalFat.toFixed(1)}g (目標: ${p.targetFat}g)
- 運動消耗量：${Math.round(totalOut)} kcal
- TDEE (基本消耗)：${tdee} kcal
- 今日卡路里淨平衡：${Math.round(netCalories)} kcal

【科學預估值】
- 預估體重：${pred.weight.toFixed(2)} kg
- 預估肌肉量：${pred.muscle.toFixed(2)} kg
- 預估體脂率：${pred.fatPercent.toFixed(1)}%

【登記實測值】
- 實測體重：${log.weight ? log.weight + ' kg' : '未登記'}
- 實測肌肉量：${log.muscle ? log.muscle + ' kg' : '未登記'}
- 實測體脂率：${log.fatPercent ? log.fatPercent + '%' : '未登記'}

【代謝狀態】
- 是否進入平台期：${detectWeightPlateau() ? '是 (14天體重無變動且維持赤字)' : '否'}
`;

      const systemInstruction = `你是一位專業的繁體中文運動健身與營養教練。
請針對我提供的「今日實測體態數據、科學估算值、今日卡路里餘額、蛋白質與阻力訓練狀態」進行深度而有建設性的復盤點評。
請用專業、鼓勵且親切的口吻，指出我做得好的地方與需要改進之處，並給出具體可行的建議（例如調整熱量、多攝取蛋白質或補充水份等）。
回覆字數請控制在 150-250 字之內，以繁體中文回答，不需要使用 JSON 包裝。

以下是今天的體態與運動飲食數據資訊：
${contextPayload}`;

      return { contextPayload, systemInstruction };
    }

    // Copy AI Coach Prompt Click Event
    if (el.btnCopyCoachPrompt) {
      el.btnCopyCoachPrompt.addEventListener('click', () => {
        const { systemInstruction } = getCoachPrompt();
        navigator.clipboard.writeText(systemInstruction)
          .then(() => {
            showToast('Prompt 已複製到剪貼簿！可直接貼給 Gemini 詢問。', 'success');
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            // Fallback for copy command
            const textarea = document.createElement('textarea');
            textarea.value = systemInstruction;
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand('copy');
              showToast('Prompt 已複製到剪貼簿！', 'success');
            } catch (copyErr) {
              showToast('複製失敗，請手動選取文字複製。', 'error');
            }
            document.body.removeChild(textarea);
          });
      });
    }

    // AI Coach Deep Review Click Event
    if (el.btnTriggerAiCoach) {
      el.btnTriggerAiCoach.addEventListener('click', async () => {
        const sheetsUrl = state.profile.sheetsUrl;
        if (!sheetsUrl) {
          showToast('請先在設定中部署您的 Google Sheets URL！', 'error');
          return;
        }

        el.btnTriggerAiCoach.disabled = true;
        const originalText = el.btnTriggerAiCoach.textContent;
        el.btnTriggerAiCoach.textContent = '評估中...';
        el.aiCoachDeepBox.classList.add('coach-loading');
        el.aiCoachDeepResult.innerHTML = '<div class="spinner-small" style="display:inline-block; width:10px; height:10px; border:2px solid var(--accent-purple-light); border-top:2px solid transparent; border-radius:50%; animation: spin 1s infinite linear; margin-right:6px;"></div>正在收集今日運動與營養平衡資料，請稍候...';

        try {
          const { contextPayload } = getCoachPrompt();

          const response = await postRequest(sheetsUrl, {
            action: 'generateCoachingFeedback',
            context: contextPayload
          });

          if (response.result === 'success') {
            el.aiCoachDeepResult.innerHTML = `🧠 <b>AI 教練：</b><br>${response.text}`;
            window.lastAiCoachFeedbackDate = currentActiveDate;
            showToast('AI 私教診斷已完成！', 'success');
          } else {
            throw new Error(response.message || 'AI 診斷回傳失敗');
          }
        } catch (err) {
          console.error('AI Coach coaching error:', err);
          el.aiCoachDeepResult.textContent = '❌ 診斷失敗，請確認 API 金鑰已設定於雲端，且網路連線正常。';
          showToast('無法取得 AI 教練診斷報告。', 'error');
        } finally {
          el.btnTriggerAiCoach.disabled = false;
          el.btnTriggerAiCoach.textContent = originalText;
          el.aiCoachDeepBox.classList.remove('coach-loading');
        }
      });
    }

    updateUI();
    
    // Smooth transition loader fade-out
    setTimeout(() => {
      el.appLoader.classList.add('hidden');
    }, 600);
  }

  init();
});

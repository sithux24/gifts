/* ════════════════════════════════════════════════════════════
   BIRTHDAY GIFT — edit ONLY this file for each new person.
   Same structure every time: copy the whole folder, change the
   details below, swap the photos in /assets, send it.

   Gift box types for `boxes` (use as many as you like, 3–8 works best):
     gallery   photos on a clothesline        cake      blow candles & wish
     letter    typewriter letter + photo      quiz      questions about you two
     scratch   scratch-card prize             reasons   pull-a-reason jar
     timeline  dated story                    match     memory-match game
     coupons   redeemable coupons             wishes    notes from several people
     media     voice note / song / video      message   simple pop-up note
   ════════════════════════════════════════════════════════════ */

window.GIFT_CONFIG = {

  /* ── WHO IS IT FOR ── */
  name: "Alex",                       // shown nowhere obvious but used in titles
  passcode: "2009",                   // any length: "1234", "090305"...
  lockTitle: "Enter a passcode",
  lockHint: "Enter the 4-digit secret passcode 💖",
  wrongText: "Oops! Wrong passcode! Try again, cutie! 🥺",

  /* Mascot / reaction images (missing files fall back to emoji) */
  mascot: {
    lock: "assets/shinchan-birthday.png",
    wrong: "assets/shinchan-wrong.png",
    dance: "assets/shinchan-dance.gif",
    excited: "assets/shinchan-excited.gif",
    pleading: "assets/shinchan-pleading.gif",
    gift: "assets/shinchan-gift.gif"
  },

  /* ── LOOK & OPENING ── */
  rememberProgress: false,            // false = fresh every time it's opened (no ticks). true = remember opened boxes
  siteTitle: "Happy Birthday 🎂",
  theme: { p: "#c9172f", a: "#ff7597", bg: "#fff2f6", ink: "#8c1932" },   // main, accent, background, text
  countdown: { enabled: true, seconds: 5, label: "Something special is about to begin…", endText: "🎉" },

  /* ── TEXTS ── */
  intro: {
    title: "I have made something for you",
    prompt: "Do you wanna see it ?",
    no: "Are you sure? 🥺 Please say YES! 💖",
    excited: "Are you really excited?"
  },
  giftsTitle: "Tap on the mystery box",
  giftsSubtitle: "to unlock your gifts!",
  finale: "You opened everything! Happy birthday, I love you 💖🎂",

  /* ── THE GIFT BOXES ── */
  boxes: [
    { type: "gallery", label: "Memories", title: "MEMORIES", photos: [
      { src: "assets/memory1.jpg", caption: "Waku Waku Cake! 🎂" },
      { src: "assets/memory2.jpg", caption: "Heh! Peanuts & Gift 🎁" },
      { src: "assets/memory3.jpg", caption: "Best Friend! 🎈" },
      { src: "assets/memory4.jpg", caption: "Make A Wish 🕯️✨" },
      { src: "assets/memory5.jpg", caption: "Secret Agent & Bond 🐶" }
    ]},

    { type: "cake", label: "Make a wish", candles: 7,
      wish: "May your year be as sweet, bright and delightful as this cake! All your dreams will come true! 💖🍰✨" },

    { type: "letter", label: "Love letter", photo: "assets/memory1.jpg",
      headline: "Happy birthday to my favourite\nperson! ❤️",
      paragraphs: [
        "I hope this year brings you everything you've been wishing for and so much more. Thank you for making my days happier, my bad days easier, and my life a little more beautiful just by being in it. 🥺💖",
        "I'm so lucky to have you, and I can't wait to make a million more memories with you. Here's to you, your dreams, and all the happiness you deserve."
      ],
      closing: "Happy birthday, my love. I love you more than you know. 🫶🏻🎂❤️" },

    { type: "quiz", label: "How well do you know me?", title: "Quick quiz!",
      questions: [
        { q: "Where did we first meet?", options: ["School", "Online", "A party", "Neighbours"], answer: 1, explain: "Of course you remembered 😌" },
        { q: "My favourite snack is…?", options: ["Chips", "Chocolate", "Peanuts", "Fruit"], answer: 2, explain: "Peanuts forever 🥜" },
        { q: "What do I call you when I'm teasing?", options: ["Cutie", "Boss", "Sleepyhead", "Monkey"], answer: 0, explain: "Cutie, obviously 💖" }
      ],
      results: ["Hmm… we need more hang-out time 😜", "Pretty good! You know me well 💕", "Perfect score! You're my person 🏆"] },

    { type: "scratch", label: "Scratch card", prize: "🎟️ One free dinner, your choice!", note: "Scratch the silver to reveal your birthday prize" },

    { type: "reasons", label: "Reasons jar", title: "Reasons you're amazing",
      reasons: ["You laugh at my worst jokes.", "You make ordinary days feel special.", "You're kind even when you're tired.", "You believe in me.", "Your smile fixes everything."] },

    { type: "wishes", label: "Wishes from everyone", title: "Birthday wishes 💌",
      wishes: [
        { from: "Mom", text: "Happy birthday, sweetheart! So proud of you." },
        { from: "Best friend", text: "Another year older, still my favourite weirdo!" },
        { from: "Me", text: "I'm so glad you exist. Always." }
      ] },

    { type: "media", label: "Voice note", kind: "audio", src: "assets/voice-note.mp3", caption: "Press play 🎧 (a message just for you)" }
  ]
};

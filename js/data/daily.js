// 每日一字：同一個概念用六種語言對照（首頁 Dashboard 用，依日期輪替）。
// items 依語言代碼，前端會自動對到旗子與朗讀語音。
export const DAILY = [
  { zh: '你好', items: [
    { code: 'ja', w: 'こんにちは', r: 'konnichiwa' }, { code: 'ko', w: '안녕하세요', r: 'annyeonghaseyo' },
    { code: 'en', w: 'Hello', r: 'həˈloʊ' }, { code: 'it', w: 'Ciao', r: 'tʃao' },
    { code: 'sv', w: 'Hej', r: 'hej' }, { code: 'es', w: 'Hola', r: 'O-la' } ] },
  { zh: '謝謝', items: [
    { code: 'ja', w: 'ありがとう', r: 'arigatō' }, { code: 'ko', w: '감사합니다', r: 'gamsahamnida' },
    { code: 'en', w: 'Thank you', r: 'θæŋk juː' }, { code: 'it', w: 'Grazie', r: 'GRAT-tsye' },
    { code: 'sv', w: 'Tack', r: 'tack' }, { code: 'es', w: 'Gracias', r: 'GRA-thyas' } ] },
  { zh: '水', items: [
    { code: 'ja', w: '水', r: 'みず mizu' }, { code: 'ko', w: '물', r: 'mul' },
    { code: 'en', w: 'Water', r: 'ˈwɔːtər' }, { code: 'it', w: 'Acqua', r: 'AK-kwa' },
    { code: 'sv', w: 'Vatten', r: 'VAT-ten' }, { code: 'es', w: 'Agua', r: 'A-gwa' } ] },
  { zh: '咖啡', items: [
    { code: 'ja', w: 'コーヒー', r: 'kōhī' }, { code: 'ko', w: '커피', r: 'keo-pi' },
    { code: 'en', w: 'Coffee', r: 'ˈkɔːfi' }, { code: 'it', w: 'Caffè', r: 'kaf-FE' },
    { code: 'sv', w: 'Kaffe', r: 'KAF-feh' }, { code: 'es', w: 'Café', r: 'ka-FE' } ] },
  { zh: '朋友', items: [
    { code: 'ja', w: '友達', r: 'ともだち tomodachi' }, { code: 'ko', w: '친구', r: 'chin-gu' },
    { code: 'en', w: 'Friend', r: 'frend' }, { code: 'it', w: 'Amico', r: 'a-MI-ko' },
    { code: 'sv', w: 'Vän', r: 'ven' }, { code: 'es', w: 'Amigo', r: 'a-MI-go' } ] },
  { zh: '今天', items: [
    { code: 'ja', w: '今日', r: 'きょう kyō' }, { code: 'ko', w: '오늘', r: 'o-neul' },
    { code: 'en', w: 'Today', r: 'təˈdeɪ' }, { code: 'it', w: 'Oggi', r: 'OD-ji' },
    { code: 'sv', w: 'Idag', r: 'i-DAG' }, { code: 'es', w: 'Hoy', r: 'oi' } ] },
  { zh: '吃', items: [
    { code: 'ja', w: '食べる', r: 'たべる taberu' }, { code: 'ko', w: '먹다', r: 'meok-da' },
    { code: 'en', w: 'Eat', r: 'iːt' }, { code: 'it', w: 'Mangiare', r: 'man-JA-re' },
    { code: 'sv', w: 'Äta', r: 'EH-ta' }, { code: 'es', w: 'Comer', r: 'ko-MER' } ] },
  { zh: '書', items: [
    { code: 'ja', w: '本', r: 'ほん hon' }, { code: 'ko', w: '책', r: 'chaek' },
    { code: 'en', w: 'Book', r: 'bʊk' }, { code: 'it', w: 'Libro', r: 'LI-bro' },
    { code: 'sv', w: 'Bok', r: 'book' }, { code: 'es', w: 'Libro', r: 'LI-bro' } ] },
  { zh: '好', items: [
    { code: 'ja', w: 'いい', r: 'ii' }, { code: 'ko', w: '좋다', r: 'jo-ta' },
    { code: 'en', w: 'Good', r: 'ɡʊd' }, { code: 'it', w: 'Buono', r: 'BWO-no' },
    { code: 'sv', w: 'Bra', r: 'braa' }, { code: 'es', w: 'Bueno', r: 'BWE-no' } ] },
  { zh: '錢', items: [
    { code: 'ja', w: 'お金', r: 'おかね okane' }, { code: 'ko', w: '돈', r: 'don' },
    { code: 'en', w: 'Money', r: 'ˈmʌni' }, { code: 'it', w: 'Soldi', r: 'SOL-di' },
    { code: 'sv', w: 'Pengar', r: 'PENG-ar' }, { code: 'es', w: 'Dinero', r: 'di-NE-ro' } ] },
  { zh: '早安', items: [
    { code: 'ja', w: 'おはよう', r: 'ohayō' }, { code: 'ko', w: '좋은 아침', r: 'jo-eun a-chim' },
    { code: 'en', w: 'Good morning', r: 'ɡʊd ˈmɔːnɪŋ' }, { code: 'it', w: 'Buongiorno', r: 'bwon-DJOR-no' },
    { code: 'sv', w: 'God morgon', r: 'good MOR-ron' }, { code: 'es', w: 'Buenos días', r: 'BWE-nos DI-as' } ] },
  { zh: '再見', items: [
    { code: 'ja', w: 'さようなら', r: 'sayōnara' }, { code: 'ko', w: '안녕히 가세요', r: 'annyeonghi gaseyo' },
    { code: 'en', w: 'Goodbye', r: 'ˌɡʊdˈbaɪ' }, { code: 'it', w: 'Arrivederci', r: 'ar-ri-ve-DER-chi' },
    { code: 'sv', w: 'Hej då', r: 'hej doh' }, { code: 'es', w: 'Adiós', r: 'a-DYOS' } ] },
];

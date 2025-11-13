const sounds = {
    diceRoll: jsfxr.sfxr_get_sound(0,,0.0768,0.2294,0.3449,0.5979,,,,,,0.3299,-0.0211,,,,,,1,,,-0.0125,0.0101),
    buyProperty: jsfxr.sfxr_get_sound(0,,0.1695,,0.4289,0.3099,,0.2059,,,,,,0.5412,,,,,1,,,,,0.5),
    passGo: jsfxr.sfxr_get_sound(3,,0.17,,0.43,0.24,,-0.54,,,,,,,,,,,1,,,,,0.5),
    cardDraw: jsfxr.sfxr_get_sound(1,,0.1,0.4,0.2,0.6,,,,,,,,,,,,,,,1,,,,,0.5)
};

function playSound(sound) {
    const audio = new Audio();
    audio.src = jsfxr.sfxr_get_wav_url(sound);
    audio.play();
}

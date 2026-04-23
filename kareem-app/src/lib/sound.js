export const playNotificationSound = () => {
    try {
        // 1. Cek apakah ada custom ringtone di localStorage
        const customRingtone = localStorage.getItem('kareeem_custom_ringtone')
        if (customRingtone) {
            const audio = new Audio(customRingtone)
            audio.play().catch(err => {
                console.warn('Gagal play custom audio, fallback ke default', err)
                playDefaultSynth()
            })
            return
        }

        // 2. Fallback ke Web Audio API (Default yg diperpanjang)
        playDefaultSynth()
    } catch (err) {
        console.warn('Failed to play notification synth:', err)
    }
}

const playDefaultSynth = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)
        
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + duration)
    }

    const now = ctx.currentTime
    // Bikin nada yang lebih panjang dan mengulang (seperti alarm masuk)
    // Ding - Dong, Ding - Dong, Ding - Dong
    for (let i = 0; i < 3; i++) {
        const offset = i * 0.8 // Jeda antar ulangan
        playBeep(880, now + offset, 0.3)        // Ding (A5)
        playBeep(659.25, now + offset + 0.15, 0.6) // Dong (E5)
    }
}

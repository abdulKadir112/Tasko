import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

let isStarting = false;
let isStopping = false;

// =========================================================
// START RECORDING
// =========================================================

export async function startRecording(): Promise<boolean> {
  // Duplicate start আটকানো
  if (isStarting) {
    console.log("⚠️ Recording start already running");
    return false;
  }

  // Stop চলাকালীন start করা যাবে না
  if (isStopping) {
    console.log("⚠️ Recording stop is still running");
    return false;
  }

  // আগে থেকেই recording থাকলে নতুন recording তৈরি করবে না
  if (recording) {
    console.log("⚠️ Recording already active");
    return false;
  }

  isStarting = true;

  try {
    console.log("🎤 START RECORDING");

    // =====================================================
    // MICROPHONE PERMISSION
    // =====================================================

    const permission =
      await Audio.requestPermissionsAsync();

    console.log(
      "🎙️ Microphone permission:",
      permission.granted
    );

    if (!permission.granted) {
      console.log(
        "❌ Microphone permission denied"
      );

      return false;
    }

    // =====================================================
    // AUDIO MODE
    // =====================================================

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // =====================================================
    // CREATE RECORDING
    // =====================================================

    const newRecording =
      new Audio.Recording();

    // =====================================================
    // PREPARE
    // =====================================================

    await newRecording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    // Prepare সফল হওয়ার পর reference রাখছি
    recording = newRecording;

    // =====================================================
    // START
    // =====================================================

    await newRecording.startAsync();

    console.log(
      "✅ Recording Started"
    );

    return true;
  } catch (error) {
    console.log(
      "❌ START RECORDING ERROR:",
      error
    );

    // Failed recording cleanup
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // ignore cleanup error
      }

      recording = null;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {
      // ignore
    }

    return false;
  } finally {
    isStarting = false;
  }
}

// =========================================================
// STOP RECORDING
// =========================================================

export async function stopRecording(): Promise<string | null> {
  // Duplicate stop আটকানো
  if (isStopping) {
    console.log(
      "⚠️ STOP already running"
    );

    return null;
  }

  // Recording এখনো start হচ্ছে
  if (isStarting) {
    console.log(
      "⚠️ Recording is still starting"
    );

    return null;
  }

  if (!recording) {
    console.log(
      "❌ No active recording"
    );

    return null;
  }

  isStopping = true;

  const currentRecording =
    recording;

  // আগে reference clear
  recording = null;

  try {
    console.log(
      "🛑 STOP RECORDING"
    );

    await currentRecording.stopAndUnloadAsync();

    const uri =
      currentRecording.getURI();

    console.log(
      "🎵 Recording Saved:",
      uri
    );

    // =====================================================
    // RESET AUDIO MODE
    // =====================================================

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.log(
        "⚠️ Audio mode reset error:",
        error
      );
    }

    return uri;
  } catch (error) {
    console.log(
      "❌ STOP RECORDING ERROR:",
      error
    );

    return null;
  } finally {
    isStopping = false;
  }
}

// =========================================================
// CANCEL RECORDING
// =========================================================

export async function cancelRecording(): Promise<void> {
  // Stop চললে cancel করবে না
  if (isStopping) {
    console.log(
      "⚠️ Cannot cancel while stopping"
    );

    return;
  }

  // Start চললে cancel করবে না
  if (isStarting) {
    console.log(
      "⚠️ Cannot cancel while starting"
    );

    return;
  }

  const currentRecording =
    recording;

  // আগে reference clear
  recording = null;

  try {
    console.log(
      "🗑️ CANCEL RECORDING"
    );

    if (currentRecording) {
      try {
        await currentRecording.stopAndUnloadAsync();
      } catch (error) {
        console.log(
          "⚠️ Cancel cleanup:",
          error
        );
      }
    }

    // =====================================================
    // RESET AUDIO MODE
    // =====================================================

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {
      // ignore
    }

    console.log(
      "✅ Recording cancelled"
    );
  } catch (error) {
    console.log(
      "❌ CANCEL RECORDING ERROR:",
      error
    );

    recording = null;
  }
}
import { Audio } from "expo-av";

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<boolean> {
  try {
    const permission = await Audio.requestPermissionsAsync();

    if (!permission.granted) {
      console.log("Microphone permission denied");
      return false;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    recording = new Audio.Recording();

    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    await recording.startAsync();

    console.log("🎤 Recording Started");

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export async function stopRecording(): Promise<string | null> {
  try {
    if (!recording) return null;

    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();

    recording = null;

    console.log("🎤 Recording Saved:", uri);

    return uri;
  } catch (e) {
    console.log(e);
    return null;
  }
}
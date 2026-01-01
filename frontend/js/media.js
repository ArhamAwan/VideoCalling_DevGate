export async function startMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    document.getElementById("localVideo").srcObject = stream;
    return stream;
  } catch (err) {
    alert("Camera/Mic access denied");
    console.error(err);
  }
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-connected", socket.id);

      socket.on("offer", (data) => {
        socket.to(data.target).emit("offer", { sdp: data.sdp, sender: socket.id });
      });

      socket.on("answer", (data) => {
        socket.to(data.target).emit("answer", { sdp: data.sdp, sender: socket.id });
      });

      socket.on("ice-candidate", (data) => {
        socket.to(data.target).emit("ice-candidate", { candidate: data.candidate, sender: socket.id });
      });

      socket.on("disconnect", () => {
        socket.to(roomId).emit("user-disconnected", socket.id);
      });
    });
  });
};

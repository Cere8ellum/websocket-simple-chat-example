import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

export const runServer = () => {
  const host = "localhost";
  const port = 3000;

  const server = http.createServer((req, res) => {
    if (req.method === "GET") {
      const filePath = path.join(process.cwd(), "./index.html");
      const rs = fs.createReadStream(filePath);

      rs.pipe(res);
    }
  });

  const socket = new Server(server);
  const users = new Map();

  socket.on("connection", (client) => {
    /***************** NEW CLIENT */
    client.on("NEW_USER_EVENT", (data) => {
      users.set(client.id, data.msg);
      const msg = [data.msg, "connected", Array.from(users, ([k, v]) => v)];

      client.broadcast.emit("NEW_CONN_EVENT", { msg: msg });
      client.emit("NEW_CONN_EVENT", { msg: msg });
    });

    /***************** NEW MESSAGE */
    client.on("NEW_MSG_EVENT", (data) => {
      const msg = [users.get(client.id), data.msg];
      client.broadcast.emit("NEW_MSG_EVENT", { msg: msg });
      client.emit("NEW_MSG_EVENT", { msg: msg });
    });
    /***************** CLIENT DISCONNECTED */
    client.on("disconnect", () => {
      const username = users.get(client.id);
      // If authenticated
      if (users.has(client.id)) {
        users.delete(client.id);
        const msg = [
          username,
          "has left this chat",
          Array.from(users, ([k, v]) => v),
        ];

        client.broadcast.emit("CONN_DISABLED_EVENT", {
          msg: msg,
        });
      }
    });
  });

  server.listen(port, host, () =>
    console.log(`Server running at http://${host}:${port}`)
  );
};

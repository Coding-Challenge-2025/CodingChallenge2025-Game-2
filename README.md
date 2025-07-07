1. Navigate to `server/` then run `npm run server-run` 
2. Navigate to `client/` then run `npm run host`
3. done

If any crashes encountered, restart the server (by rerun `npm run server-run`); logout all users, audiences, host and relogin (frontend doesn't need to be restarted) and reiterate the game manually  (and pray so no more crashes gonna happen later on 🙏)

Frontend and backend running on different port, ngrok free plan does not work. Tailscale (or any local VPN services, or a telnet) is recommended to connect host, audiences and players machine together 
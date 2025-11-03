document.getElementById("create-btn").onclick = function () {
  const input = document.getElementById("big-box").value.trim();
  const data = JSON.parse(input);

  const encodedState = encodeURIComponent(data.state);
  let actionUrl;
  if (data.org) {
    document.getElementById("info").textContent =
      `Creating app for organization: ${data.org}`;
    actionUrl = `https://github.com/organizations/${encodeURIComponent(data.org)}/settings/apps/new?state=${encodedState}`;
  } else {
    document.getElementById("info").textContent = "Creating personal app";
    actionUrl = `https://github.com/settings/apps/new?state=${encodedState}`;
  }

  const manifestStr = JSON.stringify(data.manifest).replace(/'/g, "&#39;");
  const formHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <form id="f" action="${actionUrl}" method="post">
          <input type="hidden" name="manifest" value='${manifestStr}'>
        </form>
        <script>
          document.getElementById("f").submit();
        <\/script>
      </body>
    </html>
  `;
  const win = window.open("", "_blank");
  win.document.write(formHtml);
  win.document.close();
};

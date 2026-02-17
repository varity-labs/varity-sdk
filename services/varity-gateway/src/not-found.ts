export const notFoundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Not Found - Varity</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      text-align: center;
      max-width: 480px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: #fff;
    }
    p {
      color: #a3a3a3;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    a {
      color: #818cf8;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    .code { font-size: 4rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>This app doesn't exist yet on Varity</h1>
    <p>The app you requested hasn't been deployed. If you're a developer, deploy your app with the Varity CLI to claim it.</p>
    <p><a href="https://docs.varity.so">Read the docs</a> &middot; <a href="https://varity.so">Learn about Varity</a></p>
  </div>
</body>
</html>`;

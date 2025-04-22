/**
 * Jelszóvisszaállítási űrlap HTML sablonja
 */
exports.resetPasswordTemplate = (token) => {
    return `
  <!DOCTYPE html>
  <html lang="hu">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jelszó visszaállítása - IdCard App</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
          }
          .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              width: 100%;
              max-width: 500px;
          }
          h1 {
              color: #333;
              margin-top: 0;
              margin-bottom: 20px;
              text-align: center;
          }
          .form-group {
              margin-bottom: 20px;
          }
          label {
              display: block;
              margin-bottom: 5px;
              font-weight: bold;
              color: #555;
          }
          input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 5px;
              font-size: 16px;
              box-sizing: border-box;
          }
          button {
              background-color: #4CD964;
              color: white;
              border: none;
              padding: 12px 20px;
              font-size: 16px;
              border-radius: 5px;
              cursor: pointer;
              width: 100%;
              font-weight: bold;
          }
          button:hover {
              background-color: #3cb054;
          }
          .error {
              color: #FF3B30;
              margin-top: 20px;
              text-align: center;
          }
          .success {
              color: #4CD964;
              margin-top: 20px;
              text-align: center;
          }
          .password-requirements {
              font-size: 12px;
              color: #777;
              margin-top: 5px;
          }
          .app-download {
              margin-top: 30px;
              text-align: center;
          }
          .app-download a {
              color: #007AFF;
              text-decoration: none;
          }
          .app-download a:hover {
              text-decoration: underline;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Jelszó visszaállítása</h1>
          <div id="formContainer">
              <form id="resetPasswordForm">
                  <input type="hidden" name="token" value="${token}" id="tokenInput">
                  
                  <div class="form-group">
                      <label for="password">Új jelszó</label>
                      <input type="password" id="password" name="password" required>
                      <p class="password-requirements">A jelszónak legalább 8 karakter hosszúnak kell lennie.</p>
                  </div>
                  
                  <div class="form-group">
                      <label for="confirmPassword">Új jelszó megerősítése</label>
                      <input type="password" id="confirmPassword" name="confirmPassword" required>
                  </div>
                  
                  <button type="submit">Jelszó megváltoztatása</button>
              </form>
              <div id="errorMessage" class="error" style="display: none;"></div>
              <div id="successMessage" class="success" style="display: none;"></div>
          </div>
          
          <div class="app-download">
              <p>Töltse le az IdCard alkalmazást:</p>
              <a href="#" target="_blank">Android</a> | 
              <a href="#" target="_blank">iOS</a>
          </div>
      </div>
  
      <script>
          document.addEventListener('DOMContentLoaded', function() {
              const form = document.getElementById('resetPasswordForm');
              const errorMessage = document.getElementById('errorMessage');
              const successMessage = document.getElementById('successMessage');
              
              form.addEventListener('submit', async function(e) {
                  e.preventDefault();
                  
                  const password = document.getElementById('password').value;
                  const confirmPassword = document.getElementById('confirmPassword').value;
                  const token = document.getElementById('tokenInput').value;
                  
                  // Alapvető validációk
                  if (password.length < 8) {
                      errorMessage.textContent = 'A jelszónak legalább 8 karakter hosszúnak kell lennie';
                      errorMessage.style.display = 'block';
                      return;
                  }
                  
                  if (password !== confirmPassword) {
                      errorMessage.textContent = 'A két jelszó nem egyezik';
                      errorMessage.style.display = 'block';
                      return;
                  }
                  
                  try {
                      // API hívás a jelszó megváltoztatásához
                      const response = await fetch('/api/auth/reset-password/' + token, {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ password, confirmPassword })
                      });
                      
                      const data = await response.json();
                      
                      if (response.ok) {
                          // Sikeres jelszóváltoztatás
                          form.style.display = 'none';
                          successMessage.textContent = data.message || 'A jelszava sikeresen megváltozott! Most már bejelentkezhet az új jelszavával az alkalmazásban.';
                          successMessage.style.display = 'block';
                      } else {
                          // Hiba történt
                          errorMessage.textContent = data.message || 'Hiba történt a jelszó megváltoztatása során.';
                          errorMessage.style.display = 'block';
                      }
                  } catch (error) {
                      console.error('Hiba történt:', error);
                      errorMessage.textContent = 'Hiba történt a kérés feldolgozása során. Kérjük, próbálja újra később.';
                      errorMessage.style.display = 'block';
                  }
              });
          });
      </script>
  </body>
  </html>
  `;
  };
  
  /**
   * Sikeres jelszó-visszaállítás utáni oldal sablonja
   */
  exports.resetSuccessTemplate = () => {
    return `
  <!DOCTYPE html>
  <html lang="hu">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sikeres jelszóváltoztatás - IdCard App</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
          }
          .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              width: 100%;
              max-width: 500px;
              text-align: center;
          }
          h1 {
              color: #4CD964;
          }
          .icon {
              font-size: 60px;
              color: #4CD964;
              margin-bottom: 20px;
          }
          .app-download {
              margin-top: 30px;
          }
          .app-download a {
              color: #007AFF;
              text-decoration: none;
          }
          .app-download a:hover {
              text-decoration: underline;
          }
          .btn {
              display: inline-block;
              background-color: #007AFF;
              color: white;
              padding: 12px 24px;
              border-radius: 5px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
          }
          .btn:hover {
              background-color: #0056b3;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="icon">✓</div>
          <h1>Jelszava sikeresen megváltozott!</h1>
          <p>Most már bejelentkezhet az IdCard alkalmazásba az új jelszavával.</p>
          
          <div class="app-download">
              <p>Ha még nem telepítette az alkalmazást:</p>
              <a href="#" target="_blank">Android</a> | 
              <a href="#" target="_blank">iOS</a>
          </div>
      </div>
  </body>
  </html>
  `;
  };
  
  /**
   * Hibás token vagy lejárt link oldal sablonja
   */
  exports.invalidTokenTemplate = () => {
    return `
  <!DOCTYPE html>
  <html lang="hu">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Érvénytelen vagy lejárt link - IdCard App</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
          }
          .container {
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              width: 100%;
              max-width: 500px;
              text-align: center;
          }
          h1 {
              color: #FF3B30;
          }
          .icon {
              font-size: 60px;
              color: #FF3B30;
              margin-bottom: 20px;
          }
          .btn {
              display: inline-block;
              background-color: #007AFF;
              color: white;
              padding: 12px 24px;
              border-radius: 5px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
          }
          .btn:hover {
              background-color: #0056b3;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="icon">✗</div>
          <h1>Érvénytelen vagy lejárt link</h1>
          <p>A jelszó visszaállító link érvénytelen vagy lejárt.</p>
          <p>Kérjük, próbálja meg újra a jelszó visszaállítását az alkalmazásban.</p>
          
          <a href="/" class="btn">Vissza a főoldalra</a>
      </div>
  </body>
  </html>
  `;
  };
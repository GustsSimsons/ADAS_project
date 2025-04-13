window.onload = function() {
    fetch('/api/check-auth', {
      method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
      if (!data.loggedIn) {
        window.location.href = '/index.html';
      }
      else {
        document.body.style.display = 'flex';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      window.location.href = '/index.html';
    });
  };
  

document.getElementById('logout-btn').addEventListener('click', function() {
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/index.html';
      } else {
        alert('Logout failed!');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
  

  const form_one = document.getElementById("left");
  const form_two = document.getElementById("right");

  form_one.addEventListener('click', () => {
    window.location.href = "/form_one.html";
  });

  form_two.addEventListener("click", () => {
    window.location.href = "/form_two.html";
  })
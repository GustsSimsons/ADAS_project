window.onload = function() {
    fetch('/api/check-auth', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        
        if (data.loggedIn) {
            window.location.href = '/general.html'
        }
        else {
            document.body.style.display = 'flex';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
  };
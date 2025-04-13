window.onload = function() {
    fetch('/api/check-auth', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        if (!data.loggedIn) {
            window.location.href = '/index.html';
        } else {
            document.body.style.display = 'flex';
            const role = data.user.role;

            if (role === 'low') {
                document.getElementById('mid').style.display = 'none';
                document.getElementById('high').style.display = 'none';
                document.getElementById('analysis-btn').style.display = 'none';
                document.getElementById('feedback-btn').style.display = 'none';
            } else if (role === 'mid') {
                document.getElementById('high').style.display = 'none';
                document.getElementById('feedback-btn').style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('Error checking auth:', error);
        window.location.href = '/index.html';
    });
};


document.getElementById('budget-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('budget-input');
    const budgetIdInput = document.getElementById('budget_id');
    const file = fileInput.files[0];
    const budgetId = budgetIdInput.value;

    if (!file || !budgetId) {
        alert("Please select a file and enter a budget ID");
        return;
    }

    const formData = new FormData();
    formData.append('budget', file);
    formData.append('budgetId', budgetId);

    try {
        const response = await fetch('/upload-budget', {
            method: 'POST',
            body: formData,
        });

        const result = await response.text();
        alert(result);
    } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload file.');
    }
});


document.getElementById('analysis-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('analysis-input');
    const budgetIdInput = document.getElementById('budget_id');
    const file = fileInput.files[0];
    const budgetId = budgetIdInput.value;

    if (!file || !budgetId) {
        alert("Please select an analysis file and enter a budget ID.");
        return;
    }

    const formData = new FormData();
    formData.append('analysis', file);
    formData.append('budgetId', budgetId);

    try {
        const response = await fetch('/upload-analysis', {
            method: 'POST',
            body: formData,
        });

        const result = await response.text();
        alert(result);
    } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload analysis file.');
    }
});


document.getElementById('feedback-btn').addEventListener('click', async () => {
    const feedbackInput = document.getElementById('feedback_input');
    const budgetIdInput = document.getElementById('budget_id');
    const feedbackText = feedbackInput.value.trim();
    const budgetId = budgetIdInput.value;

    if (!feedbackText || !budgetId) {
        alert("Please enter feedback and a budget ID.");
        return;
    }

    try {
        const response = await fetch('/submit-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feedback: feedbackText,
                budgetId: budgetId
            })
        });

        const result = await response.text();
        alert(result);
        feedbackInput.value = '';
    } catch (err) {
        console.error('Feedback failed:', err);
        alert('Failed to submit feedback.');
    }
});


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
  
  document.getElementById("back-btn").addEventListener("click", () => {
    window.location.href = "/general.html";
  });
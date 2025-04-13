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
        const role = data.user.role;

        if (role === 'low') {
          document.getElementById('mid').style.display = 'none';
          document.getElementById('high').style.display = 'none';
          document.getElementById("get-petition-btn").style.display = "none";
          document.getElementById("approve-task-btn").style.display = "none";
        } else if (role === 'mid') {
          document.getElementById('high').style.display = 'none';
          document.getElementById("approve-task-btn").style.display = "none";
        }
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

document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "/general.html";
});


document.getElementById('send-petition-btn').addEventListener('click', function(event) {


  // Collect the data from the form inputs
  const employee_id = document.getElementById('low1').value || null; // Allow empty fields to be null
  const plan_id = document.getElementById('low2').value || null;
  const task_description = document.getElementById('low3').value || null;
  const task_priority = document.getElementById('low4').value || null;
  const task_deadline = document.getElementById('low5').value || null;
  const CS_comments = document.getElementById('mid1').value || null;
  const CTO_comments = document.getElementById('high1').value || null;

  // Check if required fields are filled
  if (!employee_id || !plan_id || !task_description || !task_deadline || !task_priority) {
    alert('Employee ID, Plan ID, Task Description, Task Deadline, and Task Priority are required.');
    return;
  }

  // Check if the priority is valid
  const validPriorities = ['weak', 'average', 'strong'];
  if (!validPriorities.includes(task_priority)) {
    alert('Task Priority must be one of: weak, average, or strong.');
    return;
  }

  // Create an object to send as the request body
  const petitionData = {
    employee_id,
    plan_id,
    task_description,
    task_priority,
    task_deadline,
    CS_comments,
    CTO_comments
  };

  // Send a POST request to the server to insert the petition into the database
  fetch('/api/send-petition', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(petitionData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Petition submitted successfully');
      // You can redirect or clear the form here if you want
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while submitting the petition');
  });
});


// Function to populate the form with petition data
function populateForm(petition) {
  // Set the form fields with the petition data
  document.getElementById('low1').value = petition.employee_id || '';
  document.getElementById('low2').value = petition.plan_id || '';
  document.getElementById('low3').value = petition.task_description || '';
  document.getElementById('low4').value = petition.task_priority || '';
  document.getElementById('low5').value = petition.task_deadline || '';
  document.getElementById('mid1').value = petition.CS_comments || '';
  document.getElementById('high1').value = petition.CTO_comments || '';
  document.getElementById('petition-id').value = petition.petition_id || '';
}

// Function to handle the "Get Petition" button click
document.getElementById('get-petition-btn').addEventListener('click', function() {
  fetch('/api/get-petition')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const petition = data.petition;
        populateForm(petition);
      } else {
        alert('No petition found in the petition table');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred while fetching the petition');
    });
});


// Function to handle the "Approve Task" button click
document.getElementById('approve-task-btn').addEventListener('click', function() {
  const petitionId = document.getElementById("petition-id").value;
  console.log(petitionId);

  // Ensure the petitionId is available
  if (!petitionId) {
    alert('No petition to approve');
    return;
  }

  fetch('/api/approve-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ petitionId: petitionId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Task approved and moved to tasks table');
      document.getElementById('low1').value = '';
      document.getElementById('low2').value = '';
      document.getElementById('low3').value = '';
      document.getElementById('low4').value = '';
      document.getElementById('low5').value = '';
      document.getElementById('mid1').value = '';
      document.getElementById('high1').value = '';
    } else {
      alert('Failed to approve task: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while approving the task');
  });
});

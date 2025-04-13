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

  const employee_id = document.getElementById('low1').value || null;
  const plan_id = document.getElementById('low2').value || null;
  const task_description = document.getElementById('low3').value || null;
  const task_priority = document.getElementById('low4').value || null;
  const task_deadline = document.getElementById('low5').value || null;
  const CS_comments = document.getElementById('mid1').value || null;
  const CTO_comments = document.getElementById('high1').value || null;

  if (!employee_id || !plan_id || !task_description || !task_deadline || !task_priority) {
    alert('Employee ID, Plan ID, Task Description, Task Deadline, and Task Priority are required.');
    return;
  }

  const validPriorities = ['weak', 'average', 'strong'];
  if (!validPriorities.includes(task_priority)) {
    alert('Task Priority must be one of: weak, average, or strong.');
    return;
  }

  const petitionData = {
    employee_id,
    plan_id,
    task_description,
    task_priority,
    task_deadline,
    CS_comments,
    CTO_comments
  };


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
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('An error occurred while submitting the petition');
  });
});



function populateForm(petition) {
  document.getElementById('low1').value = petition.employee_id || '';
  document.getElementById('low2').value = petition.plan_id || '';
  document.getElementById('low3').value = petition.task_description || '';
  document.getElementById('low4').value = petition.task_priority || '';
  document.getElementById('low5').value = petition.task_deadline || '';
  document.getElementById('mid1').value = petition.CS_comments || '';
  document.getElementById('high1').value = petition.CTO_comments || '';
  document.getElementById('petition-id').value = petition.petition_id || '';
}

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


document.getElementById('approve-task-btn').addEventListener('click', function() {
  const petitionId = document.getElementById("petition-id").value;
  console.log(petitionId);

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

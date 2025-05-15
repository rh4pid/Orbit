let location = [];

const updateLocation = (newValue) => {
  location = newValue;
};

const getLocation = () => location;

export {updateLocation};

// const lineCtx = document.getElementById('lineChart').getContext('2d');
// const locations = ['Oyibi', 'Madina', 'Osu', 'Tema', "Ashiyie"]; 

// // Travel data: representing the artisan's locations throughout the week
// const travelData = [1, 2, 3, 1, 2, 3, 0, 4]; 

// // Create the line chart
// new Chart(lineCtx, {
//   type: 'line',
//   data: {
//     labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 
//     datasets: [{
//       label: 'Job Locations',
//       data: travelData,
//       borderColor: 'darkblue',
//       backgroundColor: 'rgba(0, 123, 255, 0.2)',
//       fill: true,
//     }]
//   },
//   options: {
//     responsive: true,
//     scales: {
//       y: {
//         ticks: {
//           callback: function(value) {
//             return locations[value];  
//           },
//           beginAtZero: true,
//         }
//       }
//     }
//   }
// });


// // Bar Chart (Work Activity)
// const barCtx = document.getElementById('barChart').getContext('2d');
// new Chart(barCtx, {
//   type: 'bar',
//   data: {
//     labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 
//     datasets: [{
//       label: 'Activity',
//       borderWidth: 2,
//       borderRadius: 5,
//       borderColor: 'darkblue',
//       data: [5, 9, 7, 11], 
//       backgroundColor: '#007bff48'
//     }]
//   },
//   options: {
//     responsive: true
//   }
// });


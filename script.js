let expenseCategories=[], expenseEntries=[], currencySymbol='₹';
let expenseChart;

// Currency toggle
document.getElementById('currency').addEventListener('change', e=>{
  currencySymbol=e.target.value;
  updateTable();
  updateChart();
});

// Add category
function addCategory(){
  let input=document.getElementById('new-expense-category');
  let value=input.value.trim();
  if(!value) return alert('Enter category!');
  if(expenseCategories.includes(value)) return alert('Category exists!');
  expenseCategories.push(value);

  // Add to select
  let select=document.getElementById('expense-category');
  let option=document.createElement('option'); option.value=value; option.text=value; select.add(option);

  // Add to category list
  let list=document.getElementById('expense-category-list');
  let div=document.createElement('div'); div.className='category-item'; div.id=`cat-${value}`;
  div.innerHTML=value+` <button onclick="deleteCategory('${value}')">x</button>`;
  list.appendChild(div);
  input.value='';
}

// Delete category
function deleteCategory(category){
  expenseCategories=expenseCategories.filter(c=>c!==category);
  let select=document.getElementById('expense-category');
  for(let i=0;i<select.options.length;i++) if(select.options[i].value===category) select.remove(i);
  document.getElementById(`cat-${category}`).remove();
  expenseEntries=expenseEntries.filter(e=>e.category!==category);
  updateTable();
  updateChart();
}

// Add entry
function addEntry(){
  let date=document.getElementById('expense-date').value;
  let category=document.getElementById('expense-category').value;
  let amount=parseFloat(document.getElementById('expense-amount').value);
  if(!date||!category||!amount) return alert('Fill all!');
  expenseEntries.push({date, category, amount});
  document.getElementById('expense-amount').value='';
  updateTable();
  updateChart();
}

// Get filter
function getFilter(){
  let filterVal=document.getElementById('filter-month').value;
  if(!filterVal) return null;
  let [year, month]=filterVal.split('-').map(Number);
  return {year, month:month-1};
}

// Update table
function updateTable(){
  let tbody=document.getElementById('expense-table').querySelector('tbody');
  let totalCell=document.getElementById('expense-total');
  tbody.innerHTML='';
  let total=0;
  let filter=getFilter();
  expenseEntries.forEach((e,i)=>{
    let d=new Date(e.date);
    if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
    total+=e.amount;
    let tr=document.createElement('tr');
    tr.innerHTML=`<td>${e.date}</td><td>${e.category}</td><td>${currencySymbol}${e.amount}</td>
                  <td><button onclick="deleteEntry(${i})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  totalCell.innerText=currencySymbol+total;
}

// Delete entry
function deleteEntry(index){
  expenseEntries.splice(index,1);
  updateTable();
  updateChart();
}

// Update chart
function updateChart(){
  let filter=getFilter();
  let data={};
  expenseEntries.forEach(e=>{
    let d=new Date(e.date);
    if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
    if(!data[e.category]) data[e.category]=0;
    data[e.category]+=e.amount;
  });

  if(expenseChart) expenseChart.destroy();
  expenseChart=new Chart(document.getElementById('expense-chart'),{
    type:'pie',
    data:{
      labels:Object.keys(data),
      datasets:[{data:Object.values(data), backgroundColor:generateColors(Object.keys(data).length)}]
    }
  });
}

// Generate random colors
function generateColors(n){ let colors=[]; for(let i=0;i<n;i++) colors.push(`hsl(${Math.floor(Math.random()*360)},70%,60%)`); return colors; }

// Export PDF (working)
document.getElementById('export-btn').addEventListener('click', async ()=>{
  const { jsPDF } = window.jspdf;
  let pdf = new jsPDF('p','pt','a4');
  let yOffset = 20;

  pdf.setFontSize(18); pdf.text("Expense Report",150,yOffset); yOffset+=30;

  // Add Table using autoTable plugin (fallback: draw manually)
  let tableHeaders = ["Date","Category","Amount"];
  let tableData = [];
  let filter=getFilter();
  expenseEntries.forEach(e=>{
    let d=new Date(e.date);
    if(filter&&(d.getFullYear()!=filter.year||d.getMonth()!=filter.month)) return;
    tableData.push([e.date, e.category, currencySymbol+e.amount]);
  });
  pdf.setFontSize(12);
  let startY = yOffset;
  tableData.forEach((row,i)=>{
    pdf.text(row.join(" | "), 20, startY + i*20);
  });
  yOffset += tableData.length*20 + 30;

  // Add Pie Chart
  if(expenseChart){
    let img = expenseChart.toBase64Image();
    pdf.addImage(img,'PNG',150,yOffset,300,200);
  }

  pdf.save('Expense_Report.pdf');
});

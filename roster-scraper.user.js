// ==UserScript==
// @name        Vault Roster Scraper
// @namespace   http://jamwheeler.com/roster-scraper
// @description Scrapes resident data from https://vault.andrews.edu/vault and creates printable nametags
// @include     https://vault.andrews.edu/vault/app/pages/secure/dara/*
// @include     http://github.jamwheeler.com/roster-scraper/sample-room-assignments.html
// @include     https://github.jamwheeler.com/roster-scraper/sample-room-assignments.html
// @include     file://*
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @version     1.1
// @grant       none
// ==/UserScript==



// For debugging purposes, include this in the above block
// @include     file://*


console.log('Vault Roster Scraper v.1.1.0 loaded');
  
  console.log($)

if ($('div.vaultSection').length > 0){
   theSelector = $('div.vaultSection:first')
} else {
   theSelector = $('input[name=updateBedPlacements]').prev().prev().prev()
}


//$('div.vaultSection:first')
theSelector.after(
  '<div class="roster-creation">' +
  'Name order: <select id="name-format">' +
  '  <option "first-last">First Last</option>' +
  '  <option "last-first">Last, First</option>' +
  '</select>' +
'<button class="btn btn-defaut btn-xs btn-xs-vault print-roster-btn">Print Roster</button>' +
'<p>Please contact Jonathan Wheeler at <a href="mailto:jonathan.m.wheeler@gmail.com">jonathan.m.wheeler@gmail.com</a> with any problems with this roster form.</p>' +
'</div>');

/**
 * Get a table with the residents in the room
 * 
 * @params: residentList Array an array of the residents in the room
 * @returns: Returns a table with the residents on the side cells and an Andrews Logo in the center
 */

getRoomTable = function(residentList){
  var tableDeclaration = '<table style="table-layout:fixed;" text-align="center">';
  var logoString = '<img width="72" src="https://github.com/wheelerj/roster-scraper/blob/master/logo.png?raw=true" />'
  
  if ( !Array.isArray(residentList) ) {
    alert('Something went wrong. Expected room[index] to contain a list.');
  }
  
  var roomTable = tableDeclaration;
  
  switch(residentList.length){
    case 2:
      // two residents
      roomTable += '<td class="first-resident">' + residentList[0] + '</td>';
      roomTable += '<td class="andrews-logo">' + logoString + '</td>';
      roomTable += '<td class="second-resident">' + residentList[1] + '</td>';
      break;
    case 1:
      // one resident
      roomTable += '<td class="first-resident">' + residentList[0] + '</td>';
      roomTable += '<td class="andrews-logo">' + logoString + '</td>';
      roomTable += '<td class="second-resident">' + '</td>';
      break;
    default:
      // no residents
      roomTable += '<td class="first-resident">' + 'No residents' + '</td>';
      roomTable += '<td class="andrews-logo">' + logoString + '</td>';
      roomTable += '<td class="second-resident">' + '</td>';
  }
  roomTable += '</table>'
  return roomTable;
}

/**
 * Transform the page provided by vault into a printable roster.
 * This function takes no paramters, and returns undefined. It only
 * changes the gui.
 */
makePrint = function(e){

    e.preventDefault();
  // Hide most elements on the page

  $('#wrapper').hide();
  
  
  
  // Create a table for printing purposes
  $('#wrapper').after('<p>Font size: <input name="fontsize" type="number" value="14"></input></p><table class="roster-table" style="table-layout: fixed;" border=1></table>');
  
  // Dump residents into table

  // To save paper, we try to write two rooms at a time. This variable holds the second room to write
  var prevRoomNumber;

  for (var room in rooms) {
    
    // This is good coding practice to make sure the key is in the dict
    if (rooms.hasOwnProperty(room)){

      if (!prevRoomNumber) {
        // If we don't have another room lined up to print, store this room into memory and continue to next room
        prevRoomNumber = room;

      } else {
         // Because we have another room lined up to print, go ahead and print both of them       
         $('.roster-table').append('<tr class="outer"><td class="outer">' + 
             getRoomTable(rooms[prevRoomNumber]) + 
             '</td><td class="outer">' +
             getRoomTable(rooms[room]) +
             '</td></tr>');
         prevRoomNumber = null; 
      }
    }
  }
  
  // Pick up any orphans
  if (prevRoomNumber){
    $('.roster-table').append(
      '<tr class="outer"><td class="outer">' +
      getRoomTable(rooms[prevRoomNumber]) +
      '</td></tr>');
  }

  // Formatting rules. I could have done this in another css file, but it adds some complexity
  $('.roster-table tr.outer').css('height', '3cm');
  $('.roster-table td').css('overflow', 'hidden');
  $('.roster-table td.outer').css('width', '7.6cm');
  $('.roster-table td td').css('text-align', 'center');
  $('.roster-table td td').css('font-size', '14px');
  $('.roster-table td.first-resident').css('width', '2.8cm');
  $('.roster-table td.second-resident').css('width', '2.8cm');
  $('.roster-table td.andrews-logo').css('width', '2.0cm');
  $('.roster-table').show();

  // If user changes $('#fontsize'), then update the font size
  $(':input').bind('keyup mouseup', function(){
    myval = $(this).val() + 'px';
    $('.roster-table td td').css('font-size', myval)
  })

}

// Create a dictionary to place rooms in
rooms = {};

// For every row in the table generated by vault
$('#assignmentTable tbody tr').each(function(){

    // Start scraping
    var room = $(this).children('td:nth-child(1)').text();
    var name = $(this).children('td:nth-child(2)').text();

    // Remove the id number of format [000012345601] using regular expressions
    name = name.replace(/\s\[\d+\]/g,'');
    var order = $('#name-format').val()

    // If user wants First, Last, then swap the order of the names
    if (order === 'First, Last'){
        name = name.split(', ').reverse().join(' ');
    } else{
        // do nothing, we're already in this order
    }

    // add scraped text into dictionary
    if (room in rooms){
        // Aha! Another resident lives here. Add this name to the list in this room.
        rooms[room].push(name)
    } else {
        // Add this room to the dictionary
        rooms[room] = [name]
    }
})

if (Object.keys(rooms).length == 0) {
  // No rooms found in first passs. try again

    var room
    $('*:contains("Rooms Assigned")').parent('tbody').children('tr:contains("[00")').each(function () {
      var isRoomRow = $(this).children('td:nth-child(1)').text().indexOf('MEIER')+1;

      if (isRoomRow) {
         room = $(this).children('td:nth-child(1)').text().trim()
         name = $(this).children('td:nth-child(3)').text().trim()
      } else {
         name = $(this).children('td:nth-child(2)').text().trim()
      }
      name = name.replace(/\s\[\d+\]/g,'').trim();
      var order = $('#name-format').val()

      if (!name) { return }
      if (room.indexOf("Assigned") >= 0) { alert('continuing'); return }

      if (order === 'First, Last'){
          name = name.split(', ').reverse().join(' ');
      } else{
          // do nothing, we're already in this order
      }

        // add scraped text into dictionary
        if (room in rooms){
            // Aha! Another resident lives here. Add this name to the list in this room.
            rooms[room].push(name)
        } else {
            // Add this room to the dictionary
            rooms[room] = [name]
        }
    })
}

alert('Found ' + Object.keys(rooms).length + ' rooms');

// Bind our function to our button
$('.print-roster-btn').click(makePrint);

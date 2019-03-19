"use strict";
jQuery(document).ready(function($){
   var previous;
   $('.searchbar').on("change paste keyup", function() {
       var word = $(this).val();
       if(word !== '' && word !== previous){
           previous = word;
           suggestion(word, 10);
       }
   });
   $(document).on('click', '.option', function(el){
       el.preventDefault();
       var id = $(this).data('id');
       var name = $(this).data('name');
       $('.submit').prop('disabled', false);
       $('.searchbar').val(name);
       $('.value').val(id);
       $('.submit').prop('disabled', false);
       $('.autocomplete').html('');
   });
   $(document).on('click', '.submit', function(el){
       el.preventDefault();
       var id = $('.value').val();
       stat(id);
   })
});
function suggestion(text, size){
   $.getJSON(`/elastic/search/auto-complete/${text}/${size}`)
       .done(function(data){
           //console.log(data)
           const title = data.suggest.titleSuggester[0].options;
           const phase = data.suggest.phaseSuggester[0].options;
           $('.autocomplete a').each(function(){
               $(this).remove();
           });
           $.each(title, function(index, value){
               $('.autocomplete').append(`
                <a class="option" href="#" data-id="${value._id}" data-name="${value._source.title} ${value._source.phase}">
                    <span class="bold">${value._source.title}</span> ${value._source.phase}
                </a>`
               )
           });
           $.each(phase, function(index, value){
               $('.autocomplete').append(`
                <a class="option" href="#" data-id="${value._id}" data-name="${value._source.title} ${value._source.phase}">
                    ${value._source.title} <span class="bold">${value._source.phase}</span>
                </a>`
               )
           });
       });
}
function stat(id){
   $.getJSON(`/elastic/search/movie/${id}`)
       .done(function(data){
           $.each(data.hits.hits, function(index, value){
               //console.log(value)
               const details = value._source;
               
               $('.result').html(`             
                    <div class="movie">
                        <h2><u>Movie Details</u></h2>
                        <p>Title:           <span class="bold">${details.title}</span></p>
                        <p>Phase:           <span class="bold">${details.phase}</span></p>
                        <p>Category:        <span class="bold">${details.category_name}</span></p>
                        <p>Rating:          <span class="bold">${details.rating_name}</span></p>
                        <p>Release Date:    <span class="bold">${details.release_date}</span></p>   
                        <p>Format:          <span class="bold">${details.aspect_ratio_name} in ${details.viewing_format_name}</span></p>
                    </div>
               `)
           })
       });
}
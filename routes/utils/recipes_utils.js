const axios = require("axios");
const DButils = require("./DButils");
require("dotenv").config();
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, extendedIngredients, instructions, servings} = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        extendedIngredients: extendedIngredients,
        instructions: instructions,
        servings:servings
    }
}


// given an array of recipe full info - extract only the preview info
function extractPreviewRecipeDetails(recipes_info) {
  return recipes_info.map((recipe_info) => {
    //check the data type so it can work with diffrent types of data
    let data = recipe_info;
    if (recipe_info.data) {
      data = recipe_info.data;
    }
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
    } = data;
    return {
      id: id,
      title: title,
      image: image,
      readyInMinutes: readyInMinutes,
      popularity: aggregateLikes,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree
    }
  })
}

// given an array of recipes ids -> retrive all recipe preciew 
async function getRecipesPreview(recipes_ids_list) {
  let promises = [];
  recipes_ids_list.map((id) => {
    promises.push(getRecipeDetails(id));
  });
  let info_res = await Promise.all(promises);
  return extractPreviewRecipeDetails(info_res);
}

async function get3RandomPreviwe(){
    let random_recipe_info = await axios.get(`${api_domain}/random?number=3`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
    let recipes_array = random_recipe_info.data.recipes;
    return extractPreviewRecipeDetails(recipes_array);

}

async function searchRecipes(recipe_title, extended_search = {}) {
  const {
    cuisine,
    diet,
    intolerance,
    limit = 5,
    sort
  } = extended_search;

  const params = {
    query: recipe_title,
    number: limit,
    instructionsRequired: true,
    includeNutrition: false,
    apiKey: process.env.spooncular_apiKey
  };

  if (cuisine) params.cuisine = cuisine;
  if (diet) params.diet = diet;
  if (intolerance && Array.isArray(intolerance) && intolerance.length != 0) {
    params.intolerances = intolerance.join(",");
  }
  if (sort) params.sort = sort;
  const results_from_api = await axios.get(`${api_domain}/complexSearch`, {
        params: params
    });

  const ids = results_from_api.data.results.map(item => item.id);//extracting the recipe ids into array
  return ids;
}


exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;
exports.get3RandomPreviwe = get3RandomPreviwe;
exports.searchRecipes = searchRecipes;


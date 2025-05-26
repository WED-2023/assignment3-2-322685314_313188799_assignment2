const axios = require("axios");
const DButils = require("./DButils");
require("dotenv").config();
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */

// A function for normlized a U_ID formated recipeID if needed - return it as a string-int for example '21255'
function normalizeId(id) {
  // try to cast id to int
  const num = Number(id);

  if (!isNaN(num)) {
    // return ID as string
    return id;
  }
  // cut U_ from U_ID
  return  id.substring(2);;
}


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

// Using spooncular API for extract recipe details
async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, extendedIngredients, instructions, servings} = recipe_info.data;

    // check popularity in local DB 
    const local_likes_result  = await DButils.execQuery(`SELECT likes FROM recipes_local_likes WHERE  recipeID = '${id}';`);
    const local_likes = local_likes_result.length > 0 ? local_likes_result[0].likes : 0;
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes + local_likes,
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
      popularity,
      vegan,
      vegetarian,
      glutenFree,
    } = data;
    return {
      id: id,
      title: title,
      image: image,
      readyInMinutes: readyInMinutes,
      popularity: popularity,
      vegan: vegan,
      vegetarian: vegetarian,
      glutenFree: glutenFree
    }
  })
}

// given an array of recipes ids -> retrive all recipe preciew 
async function getRecipesPreview(recipes_ids_list) {
  // extreact recipe details from DB 
  db_recipes = [];
  for (const id of recipes_ids_list){
    if (id[0] == 'U')
      db_recipes.push(id);
  }
  let db_preview_recipe_records;
  if (db_recipes.length !== 0){
    db_preview_recipe_records = await DButils.execQuery(`select recipeID, title, image, readyInMinutes, vegan, vegetarian, glutenFree from recipes where recipeID IN (${db_recipes.map(id => `'${id}'`).join(',')})`);
  }
  // extreact recipe details from spooncular 
  const filteredList = recipes_ids_list.filter(id => !db_recipes.includes(id));
  let promises = [];
  filteredList.map((id) => {
    promises.push(getRecipeDetails(id));
  });
  let info_res = extractPreviewRecipeDetails(await Promise.all(promises));
  
  let all_recipes = Array.isArray(db_preview_recipe_records)
  ? info_res.concat(db_preview_recipe_records)
  : info_res;
  return all_recipes;
}

// return 3 random recipes from spooncular API
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

async function increaseRecipeLikes(recipeID) {
   const records = await DButils.execQuery(`SELECT likes FROM recipes_local_likes WHERE recipeID = '${recipeID}';`);

  // update likes
    if (records.length > 0) 
      await DButils.execQuery(`UPDATE recipes_local_likes SET likes = likes + 1 WHERE recipeID = '${recipeID}';`);
    else 
      await DButils.execQuery(`INSERT INTO recipes_local_likes (recipeID, likes) VALUES ('${recipeID}', 1);`);

    return { success: true };
    }

exports.normalizeId = normalizeId;
exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;
exports.get3RandomPreviwe = get3RandomPreviwe;
exports.searchRecipes = searchRecipes;
exports.increaseRecipeLikes = increaseRecipeLikes;


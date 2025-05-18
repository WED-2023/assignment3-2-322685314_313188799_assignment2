var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware -> to prevent not-allowd user to performed a sign-up user actions 
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    try {
      const users = await DButils.execQuery("SELECT userID FROM users");
      const userExists = users.find((x) => x.userID === req.session.user_id);
      if (userExists) {
        req.user_id = req.session.user_id;
        next();
      } else {
        res.status(401).send("Unauthorized: user not found");
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    // getFavoriteRecipes returns an array of {recepieID: xx}
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

// Mark recipeID as watched for current user session - make this action tranperent in frounted
router.post("/watch/:recipeID", (req, res) => {
  try{
  const recipeID = req.params.recipeID;
  if (!req.session.watchedRecipesIDs) {
    req.session.watchedRecipesIDs = [];
  }
  if (!req.session.watchedRecipesIDs.includes(recipeID)) {
    req.session.watchedRecipesIDs.push(recipeID);
  }
  res.status(200).send({ message: "Recipe marked as watched" });
  } catch(error){
    next(error); 
  }
});

// Get 3 watched recipes by current user
router.get("/watch", async (req, res) => {
  try{
    const recipeIDs = req.session.watchedRecipesIDs;
    if (!recipeIDs) {
     return res.status(404).send({ message: `No watched recipes by user_id: ${req.session.user_id}` });
    }
    // take first 3 random recipes from watched recipes list
    const shuffled = [...recipeIDs].sort(() => 0.5 - Math.random());
    const results = await recipe_utils.getRecipesPreview(shuffled.slice(0, 3));

    // Add user-specific info if logged in
    if (req.session && req.session.user_id){
      for (const watched_recipe of results){
        watched_recipe.isWatched = true;
        watched_recipe.isFavoriteByUser = await user_utils.isFavoriteByUser(req.session.user_id, watched_recipe.id);
      }}
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

module.exports = router;

const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildVehicleDetail = async function (req, res, next) {
  const invId = req.params.invId;
  const vehicle = await invModel.getVehicleById(invId);
  if (vehicle) {
    let nav = await utilities.getNav();
    const vehicleDetail = utilities.buildVehicleDetail(vehicle);
    res.render("./inventory/detail", {
      title: `${vehicle.inv_make} ${vehicle.inv_model}`,
      nav,
      vehicleDetail,
    });
    
  } else {
    res.render("404", { title: "404 - Vehicle Not Found", nav: await utilities.getNav() });
  }
};

/* ***************************
 *  Render the management view
 * ************************** */
invCont.buildManagementView = async function (req, res, next) {
  let nav = await utilities.getNav(); 
  const message = req.flash('message') || null;
  res.render("./inventory/management", {
    title: "Inventory Management",
    nav,
    message,
  });
};


/* ***************************
 *  Render the Add Classification View
 * ************************** */
invCont.buildAddClassificationView = async function (req, res, next) {
  let nav = await utilities.getNav(); 
  const message = req.flash('message') || null; // get flash message, if any
  res.render("./inventory/add-classification", {
    title: "Add New Classification",
    nav,
    message, // flash message for success or failure
  });
};

/* ***************************
 *  Process the new classification
 * ************************** */
invCont.addNewClassification = async function (req, res, next) {
  // Extract classification name from the form submission
  const { classification_name } = req.body;

  // Server-side validation for empty input or invalid characters
  if (!classification_name || !/^[A-Za-z0-9]+$/.test(classification_name)) {
    req.flash('message', 'Invalid classification name. No spaces or special characters allowed.');
    return res.redirect('/inv/add-classification'); // return to the form with an error message
  }

  try {
    // Insert the new classification into the database
    const insertResult = await invModel.insertClassification(classification_name);
    if (insertResult) {
      req.flash('message', 'Classification added successfully!');
    } else {
      req.flash('message', 'Failed to add classification.');
    }
    res.redirect('/inv'); // redirect to the management view on success
  } catch (error) {
    // Log error and flash message if insertion fails
    console.error('Error adding classification:', error);
    req.flash('message', 'There was an issue adding the classification. Please try again.');
    res.redirect('/inv/add-classification'); // return to form on failure
  }
};





/* ***************************
 *  Render the Add Inventory View
 * ************************** */
invCont.buildAddInventoryView = async function (req, res, next) {
  let nav = await utilities.getNav(); 
  let classificationList = await utilities.buildClassificationList();
  const message = req.flash('message') || null;
  res.render("./inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    message,
  });
};

/* ***************************
 *  Process the new vehicle
 * ************************** */
invCont.addNewVehicle = async function (req, res, next) {
  const { classification_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color } = req.body;

  // Server-side validation
  if (!classification_id || !inv_make || !inv_model || !inv_description || inv_price <= 0 || inv_miles < 0 || !inv_color) {
    req.flash('message', 'Please fill out all fields correctly.');
    return res.render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      classificationList: await utilities.buildClassificationList(classification_id),
      inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color,
      message: req.flash('message')
    });
  }

  try {
    const insertResult = await invModel.insertVehicle({
      classification_id,
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color
    });

    if (insertResult) {
      req.flash('message', 'Vehicle added successfully!');
      await utilities.refreshNav();
      res.redirect('/inv/management');
    } else {
      req.flash('message', 'Failed to add the vehicle.');
      res.redirect('/inv/add-inventory');
    }
  } catch (error) {
    console.error('Error adding vehicle:', error);
    req.flash('message', 'There was an issue adding the vehicle. Please try again.');
    res.redirect('/inv/add-inventory');
  }
};




module.exports = invCont;


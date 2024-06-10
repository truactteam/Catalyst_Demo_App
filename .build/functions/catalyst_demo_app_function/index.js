const express = require('express');
const catalystSDK = require('zcatalyst-sdk-node');
const randomstring = require('randomstring');
const fs = require('fs');
//const multer = require('multer');
const fileUpload = require('express-fileupload');
const os = require('os');
const app = express();
app.use(express.json());
app.use(fileUpload());
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// Use multer middleware to handle form data
//app.use(upload.single('image')); 
    

    
app.use((req, res, next) => {
	const catalyst = catalystSDK.initialize(req);
	const email = catalyst.email(); // Initialize the email variable
	res.locals.catalyst = catalyst;
	res.locals.email = email; // Store the email instance in res.locals for later use
	next();
	console.log(email,"emailUse");
});
app.put('/:ROWID',async(req,res)=>{
	try{
		const {ROWID}=req.params;
		const {OTP}=req.body;
		const { catalyst } = res.locals;
		let updatedRowData = {
			ROWID: ROWID,
			OTP:OTP
		}
		console.log(updatedRowData,"updatedRowData");
		const table = catalyst.datastore().table('UserData');
		console.log("OTP start");
		let rowPromise = table.updateRow(updatedRowData);
        rowPromise.then((row) => { console.log(row); });
		rowPromise.catch((err)=>{console.log(err)});

		console.log("save otp")
		res.status(200).send({
			status: 'success',
			data: {
				id:ROWID,
				OTP
			}
		  });
	}
	catch (err){
		console.log("store error");
		console.log(err);
		res.status(500).send({
			status: 'failure',
			message: "We're unable to process the request."
		});
	}
})
app.post('/otp', async (req, res) => {
	try {
		const {email}=req.body;
        function generateOTP(length) {
			const otp = randomstring.generate({
				length: length,
				charset: 'numeric'
			});
			return otp;
		}
		
		// Generate a 6-digit OTP
		const otp = generateOTP(6);
		console.log("Generated OTP:", otp);
		
		
		let config = {
			from_email: 'truact.testing@gmail.com',
			to_email: [email],
			subject: 'Verification Email',
			content: `Hello, Your OTP is ${otp}`
		};
		
		let mailPromise = await res.locals.email.sendMail(config);
		console.log(email,"emailid");
		console.log(mailPromise,"mailPromise");
		res.status(200).send({
			status: 'success',
			data: {
			  mailPromise,
			  otp
			}
		  });
	} catch (err) {
		console.log("customer error");
		console.log(err);
		res.status(500).send({
			status: 'failure',
			message: "We're unable to process the request."
		});
	}
})
app.get('/items',async(req,res) =>{
	try{
	 const { catalyst } = res.locals;
	  const zcql = catalyst.zcql();
	  let query = `SELECT ROWID, Item_ID, Item_Name,Price FROM Item_Master`;
	  const myData = await zcql.executeZCQLQuery(query);
	  const items=myData.map(row => ({
		id: row.Item_Master.ROWID,
		itemID: row.Item_Master.Item_ID,
		item_name : row.Item_Master.Item_Name,
		price : row.Item_Master.Price
	  }))

	  res.status(200).send({
		status: 'success',
		data: {
		  items
		}
	  });
	}
	catch (err) {
		console.log("items error");
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }
})
app.get('/cust',async(req,res) =>{
	try{
	 const { catalyst } = res.locals;
	  const zcql = catalyst.zcql();
	  let query = `SELECT ROWID, Customer_Name, Phone_Number FROM Customer_Master`;
	  const myData = await zcql.executeZCQLQuery(query);
	  const customers=myData.map(row => ({
		id: row.Customer_Master.ROWID,
		cust : row.Customer_Master.Customer_Name,
		phone : row.Customer_Master.Phone_Number
	  }))

	  res.status(200).send({
		status: 'success',
		data: {
		  customers
		}
	  });
	}
	catch (err) {
		console.log("customer error");
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }
})
app.get('/otp',async(req,res)=>{
	try{
		const { catalyst } = res.locals;
		const zcql = catalyst.zcql();
		let query = 'SELECT OTP FROM UserData'
		if(req.query.ROWID)
			{
				query += ` WHERE ROWID = '${req.query.ROWID}'`;
			}

			const myData = await zcql.executeZCQLQuery(query);
			const otp = myData.map(row => ({
				id: row.UserData.ROWID,
				otp: row.UserData.OTP
			  }));

			  res.status(200).send({
				status: 'success',
				data: {
				  otp
				}
			  });
	}
	catch(err)
	{
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});

	}
})
app.get('/custID', async(req,res) => {
  try{
	const { catalyst } = res.locals;
	const zcql = catalyst.zcql();
	let query = 'SELECT ROWID FROM Customer_Master'
	if(req.query.Customer_Name )
		{
			console.log("custname");
			query += ` WHERE Customer_Name = '${req.query.Customer_Name}'`;
		}

		const myData = await zcql.executeZCQLQuery(query);
		const custid = myData.map(row => ({
			id: row.Customer_Master.ROWID,
			
		  }));

		  res.status(200).send({
			status: 'success',
			data: {
			  custid
			}
		  });
       }
	   catch (err) {
		console.log("custid error");
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }

})
app.get('/login', async (req, res)=>{
	try{
		const { catalyst } = res.locals;
		const zcql = catalyst.zcql();

		let query = `SELECT ROWID,Email,Password FROM UserData`;
		
		if (req.query.Email && req.query.Password) {

			
			query += ` WHERE Email = '${req.query.Email}'`;
			
		  }

		  const myData = await zcql.executeZCQLQuery(query);
		 

          const userData = myData.map(row => ({
           
			Email : row.UserData.Email,
			
           
		  }));

          let userData2 = [];

		  if(myData.length > 0 )
			{
				let query2 = `SELECT ROWID,Email,Password FROM UserData WHERE Email = '${req.query.Email}' AND Password = '${req.query.Password}'`;
				const myData2 = await zcql.executeZCQLQuery(query2);
		 

				userData2 = myData2.map(row => ({
	                
				  ROWID : row.UserData.ROWID,
				  Email : row.UserData.Email,
				  Password : row.UserData.Password
	  
				}));

			}
	  
		  res.status(200).send({
			status: 'success',
			data: {
			   userData,
			   userData2
			
			}
		  });

	}
	catch(err){
		console.log("login error");
	  console.log(err);
	  res.status(500).send({
		status: 'failure',
		message: "We're unable to process the request."
	  });
	}
})
app.get('/all', async (req, res) => {
	try {
	  console.log("REPORTS ALL");
	  const { catalyst } = res.locals;
	  const zcql = catalyst.zcql();
	  let query = `SELECT ROWID, Order_Date, Customer_Name, Item_Name, Quantity, Weight, Check_me FROM AppStore`;
      console.log(query,"query");
	  // Check if any query parameters are provided
	  if (req.query.ROWID) {
		// If id parameter is provided, filter the results based on id
		query += ` WHERE ROWID = '${req.query.ROWID}'`;
	  }
  
	  const myData = await zcql.executeZCQLQuery(query);
      console.log(myData,"myDATA");
	  const orders = myData.map(row => ({
		id: row.AppStore.ROWID,
		order_date: row.AppStore.Order_Date,
		cust: row.AppStore.Customer_Name,
		item: row.AppStore.Item_Name,
		qty: row.AppStore.Quantity,
		wt: row.AppStore.Weight,
		chk: row.AppStore.Check_me
	  }));
  
	  res.status(200).send({
		status: 'success',
		data: {
		  orders
		}
	  });
	} catch (err) {
	  console.log("function error");
	  console.log(err);
	  res.status(500).send({
		status: 'failure',
		message: "We're unable to process the request."
	  });
	}
  });
  
app.post('/signup',async(req,res)=>{
	try{
		const{ fisrtName,lastName,email,password,address,city,states,zip} = req.body;
		const { catalyst } = res.locals;
		const table = catalyst.datastore().table('UserData');
		const { ROWID: id } = await table.insertRow({
			First_Name:fisrtName,
			Last_Name:lastName,
			Email:email,
			Password:password,
			Address:address,
			City:city,
			State:states,
			Zip:zip
		})
		res.status(200).send({
			status: 'success',
			data: {
				fisrtName,
				lastName,
				email,
				password,
				address,
				city,
				states,
				zip
			}
		  });

	}
	catch (err) {
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }
})
app.post('/items',async (req, res) => {
	try {
		const {  itemID,item,price } = req.body;
		const { catalyst } = res.locals;
		const table = catalyst.datastore().table('Item_Master');
		const { ROWID: id } = await table.insertRow({
			Item_ID: itemID,
			Item_Name: item,
			Price : price
		  });
		  res.status(200).send({
			status: 'success',
			data: {
				id,
			  itemID,
			  item,
			  price
			 
			}
		  });
	}
	catch (err) {
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }

})
app.post('/add', async (req, res) => {
	try {
	   //const { ord_date,cust,item,qty,wt,chk,custID,customFile} = req.body;
	  const formData = req.body;
	  const { catalyst } = res.locals;
	  const { ord_date,cust,item,qty,wt,chk,custID} = formData;
	  //let result = await req.customFile.data.mv(`/tmp/${req.files.data.name}`);
      let filestore = catalyst.filestore(); 
	  console.log(formData,"uploaded image");
	  console.log("ord_date",ord_date);
	  console.log("cust",cust);
	  console.log("item",item);
	  console.log("qty",qty);
	  console.log("wt",wt);
	  console.log("chk",chk);
	  console.log("custID",custID);
	  const fileName = req.files.content.data;  
    const filePath = os.tmpdir() +"/" + req.files.content.name;
    console.log("OS",os.tmpdir());
	fs.writeFileSync(filePath, fileName);
    const config = { 
      code: fs.createReadStream(filePath), 
      name: req.files.content.name, 
    };
	const folder = filestore.folder(20661000000040056);
	let file_id;
	let file_name;
	const uploadPromise = folder.uploadFile(config);
	   await uploadPromise.then(async (fileObject) => {
	  console.log(fileObject.id,"FILEOBJECT2");
	  console.log(fileObject,"FILEOBJECT");
	  file_id = fileObject.id;
	  file_name = fileObject.file_name;
	 // var file = folder.fileId(FILE_ID);
	 //const fileResponse = folder.getDownloadLink(fileObject.id);
	
	 
    });
//    await uploadPromise.then((fileObject) => {
//       res.status(200).send(fileObject);
//     });
	 //console.log("image payload",image);
	//   let config = 
	// 	{ 
	// 	code:fs.createReadStream(image)
	// 	};
	// console.log("config",config);
	//   let folder = filestore.folder(20661000000040056); 
	//   let uploadPromise = folder.uploadFile(config); 
	//   uploadPromise.then((fileObject) => {
	// 	console.log(fileObject , "fileObject"); 
	// 	});
    //    console.log("upload successful");

	  const table = catalyst.datastore().table('AppStore');
	  const { ROWID: id } = await table.insertRow({
		Order_Date : formData.ord_date,
		Customer_Name : formData.cust,
		Item_Name : formData.item,
		Quantity : formData.qty,
		Weight : formData.wt,
		Check_me : formData.chk,
		Customer_ID : formData.custID,
		image :file_name,
	   File_ID : file_id,
	   Folder_ID : 20661000000040056
		// image : formData.image
	  });
	  res.status(200).send({
		status: 'success',
		data: {
		  id,
		  ord_date,
		  cust,
		  item,
		  qty,
		  wt,
		  chk,
		  custID,
		
		}
	  });
	} catch (err) {
	  console.log(err);
	  res.status(500).send({
		status: 'failure',
		message: "We're unable to process the request."
	  });
	}
  })

  app.post('/cust',async (req, res) => {
	try {
		const { cust_name, phone } = req.body;
		const { catalyst } = res.locals;
		const table = catalyst.datastore().table('Customer_Master');
		const { ROWID: id } = await table.insertRow({
			Customer_Name: cust_name,
			Phone_Number: phone
		  });
		  res.status(200).send({
			status: 'success',
			data: {
				id,
			  cust_name,
			  phone
			}
		  });
	}
	catch (err) {
		console.log(err);
		res.status(500).send({
		  status: 'failure',
		  message: "We're unable to process the request."
		});
	  }

})
  app.put('/:ROWID', async (req, res) => {
    try {
        const { ROWID } = req.params;
        const { Order_Date, Customer_Name, Item_Name, Quantity, Weight, Check_me } = req.body;
        const { catalyst } = res.locals;
		console.log("fisrt step");
		let updatedRowData = {
		 Order_Date: Order_Date, 
		Customer_Name: Customer_Name, 
		ROWID: ROWID,
	    Item_Name : Item_Name,
	    Quantity : Quantity,
	    Weight : Weight,
	    Check_me : Check_me }; 
        const table = catalyst.datastore().table('AppStore');

		console.log("DB start");
		let rowPromise = table.updateRow(updatedRowData);
        rowPromise.then((row) => { console.log(row); });
		rowPromise.catch((err)=>{console.log(err)});
		// Update the fields
		
	    console.log("save db")
		res.status(200).send({
		  status: 'success',
		  data: {
			id: ROWID,
			Order_Date,
			Customer_Name,
			Item_Name,
			Quantity,
			Weight,
			Check_me
		  }
		});
	  }  catch (err) {
        console.log(err);
        res.status(500).send({
            status: 'failure',
            message: "We're unable to process the request."
        });
    }
});


  app.delete('/:ROWID', async (req, res) => {
	try {
	const { ROWID } = req.params;
	const { catalyst } = res.locals;
	const table = catalyst.datastore().table('AppStore');
	await table.deleteRow(ROWID);
	res.status(200).send({
	status: 'success',
	data: {
	Recipes: {
	id: ROWID
	}
	}
	});
	} catch (err) {
	console.log(err);
	res.status(500).send({
	status: 'failure',
	message: "We're unable to process the request."
	});
	}
	});
  module.exports = app;
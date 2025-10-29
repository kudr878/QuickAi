import { clerkClient } from "@clerk/express"
import sql from "../configs/db.js"
import { v2 as cloudinary } from 'cloudinary'
import axios from 'axios'
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { auth } from "../middleware/auth.js"

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt, length } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." })
    }

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3.1-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },

        ],
        stream: false,
        max_tokens: length,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      })
    }

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { prompt } = req.body
    const plan = req.plan
    const free_usage = req.free_usage

    if (plan !== 'premium' && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." })
    }

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3.1-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },

        ],
        stream: false,
        max_tokens: 100,
        temperature: 0.5,
      }),
    });

    const data = await response.json();

    const content = data.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`

    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      })
    }

    res.json({ success: true, content })
    console.log("AI response:", data);

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}


// export const generateImage = async (req, res) => {
//   try {
//     const { userId } = req.auth()
//     const { prompt, publish } = req.body
//     const plan = req.plan

//     if (plan !== 'premium') {
//       return res.json({ success: false, message: "This feature is only available for premium subscriptions." })
//     }

//     const formData = new FormData()
//     formData.append('prompt', prompt)

//     const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
//       headers: {
//         'x-api-key': process.env.CLIPDROP_API_KEY,
//       },
//       responseType: "arraybuffer",
//     })

//     const base64image = `data:image/png;base64,${Buffer.from(data, 'binary'), toString('base64')}`

//     const { secure_url } = await cloudinary.uploader.upload(base64image)

//     await sql` INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`

//     res.json({ success: true, content: secure_url })

//   } catch (error) {
//     console.log(error.message)
//     res.json({ success: false, message: error.message })
//   }
// }


export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== 'premium') {
      return res.status(403).json({ success: false, message: "This feature is only available for premium subscriptions." });
    }

    const response = await fetch("https://image.chutes.ai/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-image",
        prompt: prompt,
        negative_prompt: "blur, distortion, low quality, bad quality",
        guidance_scale: 7.5,
        width: 1024,
        height: 1024,
        num_inference_steps: 50,
      }),
    });

    const imageArrayBuffer = await response.arrayBuffer();

    const base64Image = Buffer.from(imageArrayBuffer).toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    const { secure_url } = await cloudinary.uploader.upload(dataUri)

    await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    res.json({ success: true, content: secure_url })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}


export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth()
    const image = req.file
    const plan = req.plan

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." })
    }



    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: 'background_removal',
          background_removal: 'remove_the_background'
        }
      ]
    })

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`

    res.json({ success: true, content: secure_url })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}



export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { object } = req.body
    const image = req.file
    const plan = req.plan

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." })
    }



    const { public_id } = await cloudinary.uploader.upload(image.path)

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:prompt=${object}` }],
      resource_type: 'image'
    })

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')`

    res.json({ success: true, content: imageUrl })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

export const resumeReview = async (req, res) => {
  let parser = null;
  try {
    const { userId } = req.auth()
    const resume = req.file
    const plan = req.plan

    if (plan !== 'premium') {
      return res.json({ success: false, message: "This feature is only available for premium subscriptions." })
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: "Resume file size exceeds allowed size (5MB)." })
    }

    const dataBuffer = await fs.readFile(resume.path);
    parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    const fullText = result.text;

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement. Resume content: \n\n${fullText}`

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3.1-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },

        ],
        stream: false,
        max_tokens: 5000,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    await sql` INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`

    res.json({ success: true, content })

  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}
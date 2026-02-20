import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 上传到名为 'documents' 的存储桶 [cite: 215-217]
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`uploads/${Date.now()}-${file.name}`, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) throw error

    return NextResponse.json({ 
      message: "Upload successful", 
      path: data.path 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}